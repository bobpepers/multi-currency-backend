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
// import { updatePrice } from "./helpers/price/updatePrice";
import { updateConversionRatesFiat, updateConversionRatesCrypto } from "./helpers/price/updateConversionRates";
import { initDatabaseRecords } from "./helpers/initDatabaseRecords";
import db from "./models";
import { startTokelSync } from "./services/syncTokel";
import { startRunebaseSync } from "./services/syncRunebase";
import { startPirateSync } from "./services/syncPirate";
import { patchRunebaseDeposits } from "./helpers/blockchain/runebase/patcher";
import { patchPirateDeposits } from "./helpers/blockchain/pirate/patcher";
import { patchTokelDeposits } from "./helpers/blockchain/tokel/patcher";
import { processWithdrawals } from "./services/processWithdrawals";

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

  await initDatabaseRecords();

  await startRunebaseSync(
    io,
    queue,
  );

  await patchRunebaseDeposits();

  const schedulePatchRunebaseDeposits = schedule.scheduleJob('10 */1 * * *', () => {
    patchRunebaseDeposits();
  });

  await startPirateSync(
    io,
    queue,
  );

  await patchPirateDeposits();

  const schedulePatchPirateDeposits = schedule.scheduleJob('10 */1 * * *', () => {
    patchPirateDeposits();
  });

  await startTokelSync(
    io,
    queue,
  );

  await patchTokelDeposits();

  const schedulePatchDeposits = schedule.scheduleJob('10 */1 * * *', () => {
    patchTokelDeposits();
  });

  router(
    app,
    io,
    sockets,
    queue,
  );

  const scheduleUpdateConversionRatesFiat = schedule.scheduleJob('0 */8 * * *', () => { // Update Fiat conversion rates every 8 hours
    updateConversionRatesFiat();
  });

  updateConversionRatesCrypto();
  const scheduleUpdateConversionRatesCrypto = schedule.scheduleJob('*/10 * * * *', () => { // Update price every 10 minutes
    updateConversionRatesCrypto();
  });

  // updatePrice();
  // const schedulePriceUpdate = schedule.scheduleJob('*/5 * * * *', () => { // Update price every 5 minutes
  //   updatePrice();
  // });

  const scheduleWithdrawal = schedule.scheduleJob('*/2 * * * *', async () => { // Process a withdrawal 2 minutes
    await processWithdrawals(
      io,
    );
  });

  app.use((err, req, res, next) => {
    if (err.message && err.message === "EMAIL_NOT_VERIFIED") {
      res.status(401).json({
        error: err.message,
        email: err.email,
      });
    } else if (
      (err.message && err === 'LOGIN_FAIL')
      || (err.message && err === 'AUTH_TOKEN_USED')
    ) {
      res.status(401).json({
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
