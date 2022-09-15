/* eslint-disable import/first */
import _ from 'lodash';
import PQueue from 'p-queue';
import express from "express";
import http from "http";
import bodyParser from "body-parser";
import morgan from "morgan";
import cors from "cors";
import compression from "compression";
import schedule from "node-schedule";
import helmet from "helmet";
import { config } from "dotenv";
import passport from 'passport';
import connectRedis from 'connect-redis';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { createClient as createRedisClient } from 'redis';
import socketIo from 'socket.io';
import { router } from "./router";
import { updatePrice } from "./helpers/price/updatePrice";
import { updateConversionRatesFiat, updateConversionRatesCrypto } from "./helpers/price/updateConversionRates";
import { startTokelSync } from "./services/sync/syncTokel";
import { startRunebaseSync } from "./services/sync/syncRunebase";
import { startPirateSync } from "./services/sync/syncPirate";

import { patchRunebaseDeposits } from "./services/blockchain/runebase/patcher";
import { patchPirateDeposits } from "./services/blockchain/pirate/patcher";
import { patchTokelDeposits } from "./services/blockchain/tokel/patcher";
import { patchSecretDeposits } from './services/blockchain/secret/patcher';

import { processWithdrawals } from "./services/processWithdrawals";
import { consolidateFunds } from "./services/blockchain/consolidate";

Object.freeze(Object.prototype);

config();

(async function () {
  const queue = new PQueue({
    concurrency: 1,
    timeout: 1000000000,
  });
  const port = process.env.PORT || 8080;
  const app = express();

  const server = http.createServer(app);
  const io = socketIo(server, {
    path: '/socket.io',
    cookie: false,
  });

  app.use(helmet());
  app.use(compression());
  app.use(morgan('combined'));
  app.use(cors());
  app.set('trust proxy', 1);

  const RedisStore = connectRedis(session);

  const redisClient = createRedisClient({
    database: 3,
    legacyMode: true,
  });

  await redisClient.connect();

  const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    key: "connect.sid",
    resave: false,
    proxy: true,
    saveUninitialized: false,
    ephemeral: false,
    store: new RedisStore({ client: redisClient }),
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    },
  });

  app.use(cookieParser());

  app.use(bodyParser.urlencoded({
    extended: false,
    limit: '5mb',
  }));
  app.use(bodyParser.json());

  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());

  const wrap = (middleware) => (socket, next) => middleware(socket.request, {}, next);

  io.use(wrap(sessionMiddleware));
  io.use(wrap(passport.initialize()));
  io.use(wrap(passport.session()));

  const sockets = {};

  io.on("connection", async (socket) => {
    const userId = socket.request.session.passport ? socket.request.session.passport.user : '';
    if (
      socket.request.user
      && (socket.request.user.role === 4
        || socket.request.user.role === 8)
    ) {
      socket.join('admin');
    }
    console.log('userSocketId');
    console.log(userId);
    if (userId !== '') {
      socket.join(parseInt(userId, 10));
      // sockets[parseInt(userId, 10)] = socket;
    }
    // console.log(Object.keys(sockets).length);
    socket.on("disconnect", () => {
      // delete sockets[parseInt(userId, 10)];
    });
  });

  // Runebase

  await startRunebaseSync(
    io,
    queue,
  );

  await patchRunebaseDeposits();

  const schedulePatchRunebaseDeposits = schedule.scheduleJob('10 */1 * * *', () => {
    patchRunebaseDeposits();
  });

  // Pirate

  await startPirateSync(
    io,
    queue,
  );

  await patchPirateDeposits();

  const schedulePatchPirateDeposits = schedule.scheduleJob('10 */1 * * *', () => {
    patchPirateDeposits();
  });

  // Tokel

  await startTokelSync(
    io,
    queue,
  );

  await patchTokelDeposits();

  const schedulePatchTokelDeposits = schedule.scheduleJob('10 */1 * * *', () => {
    patchTokelDeposits();
  });

  // Secret
  const schedulePatchSecretDeposits = schedule.scheduleJob('*/1 * * * *', () => {
    patchSecretDeposits(io);
  });

  router(
    app,
    io,
    sockets,
    queue,
  );

  const scheduleUpdateConversionRatesFiat = schedule.scheduleJob('0 */23 * * *', () => { // Update Fiat conversion rates every 23 hours
    updateConversionRatesFiat();
  });

  // updateConversionRatesCrypto();
  const scheduleUpdateConversionRatesCrypto = schedule.scheduleJob('*/20 * * * *', () => { // Update price every 20 minutes
    updateConversionRatesCrypto();
  });

  // updatePrice();
  const schedulePriceUpdate = schedule.scheduleJob('*/20 * * * *', () => { // Update price every 20 minutes
    updatePrice();
  });

  await consolidateFunds(
    schedule,
    queue,
  );

  const scheduleWithdrawal = schedule.scheduleJob('*/2 * * * *', async () => { // Process a withdrawal 2 minutes
    await processWithdrawals(
      io,
    );
  });

  app.use((err, req, res, next) => {
    if (err && err.message && err.message === "EMAIL_NOT_VERIFIED") {
      res.status(401).json({
        error: err.message,
        email: err.email,
      });
    } else if (
      (err && err.message && err.message === 'LOGIN_FAIL')
      || (err && err.message && err.message === 'AUTH_TOKEN_USED')
    ) {
      res.status(401).json({
        error: err.message,
      });
    } else if (
      (err && err.message && err.message === 'NOT_FOUND')
    ) {
      res.status(404).json({
        error: err.message,
      });
    } else {
      res.status(500).json({
        error: err.message,
      });
    }
  });

  server.listen(port);
  console.log('server listening on:', port);
}());
