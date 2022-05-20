/* eslint-disable no-restricted-syntax */
import walletNotifyRunebase from '../helpers/blockchain/runebase/walletNotify';
import walletNotifyPirate from '../helpers/blockchain/pirate/walletNotify';
import walletNotifyTokel from '../helpers/blockchain/tokel/walletNotify';

import { startRunebaseSync } from "../services/syncRunebase";
import { startPirateSync } from "../services/syncPirate";
import { startTokelSync } from "../services/syncTokel";

//import { incomingDepositMessageHandler } from '../helpers/messageHandlers';

const localhostOnly = (
  req,
  res,
  next,
) => {
  console.log(req.headers.host);
  console.log('check local host');
  const hostmachine = req.headers.host.split(':')[0];
  if (
    hostmachine !== 'localhost'
    && hostmachine !== '127.0.0.1'
  ) {
    return res.sendStatus(401);
  }
  next();
};

export const notifyRouter = (
  app,
  io,
  queue,
) => {
  app.post(
    '/api/rpc/blocknotify',
    localhostOnly,
    (req, res) => {
      console.log('1133');
      console.log(req.body);
      console.log('blockNotify');
      if (req.body.ticker === 'RUNES') {
        startRunebaseSync(
          queue,
        );
      } else if (req.body.ticker === 'ARRR') {
        startPirateSync(
          queue,
        );
      } else if (req.body.ticker === 'TKL') {
        walletNotifyTokel(
          queue,
        );
      }
      res.sendStatus(200);
    },
  );

  app.post(
    '/api/rpc/walletnotify',
    localhostOnly,
    async (req, res) => {
      if (req.body.ticker === 'RUNES') {
        return res.redirect('/api/rpc/walletnotify/runebase');
      } else if (req.body.ticker === 'ARRR') {
        return res.redirect('/api/rpc/walletnotify/pirate');
      } else if (req.body.ticker === 'TKL') {
        return res.redirect('/api/rpc/walletnotify/tokel');
      }
      res.sendStatus(200);
    },
  );

  app.post(
    '/api/rpc/walletnotify/runebase',
    localhostOnly,
    walletNotifyRunebase,
    async (req, res) => {
      if (res.locals.error) {
        console.log(res.locals.error);
      } else if (!res.locals.error
        && res.locals.detail
        && res.locals.detail.length > 0
      ) {
        for await (const detail of res.locals.detail) {
          if (detail.amount) {
            // await incomingDepositMessageHandler(
            //   discordClient,
            //   telegramClient,
            //   matrixClient,
            //   detail,
            // );
          }
        }
      }
      if (res.locals.activity) {
        try {
          io.to('admin').emit('updateActivity', {
            activity: res.locals.activity,
          });
        } catch (e) {
          console.log(e);
        }
      }
    },
  );

  app.post(
    '/api/rpc/walletnotify/pirate',
    localhostOnly,
    walletNotifyPirate,
    async (req, res) => {
      if (res.locals.error) {
        console.log(res.locals.error);
      } else if (!res.locals.error
        && res.locals.detail
        && res.locals.detail.length > 0
      ) {
        for await (const detail of res.locals.detail) {
          if (detail.amount) {
            // await incomingDepositMessageHandler(
            //   discordClient,
            //   telegramClient,
            //   matrixClient,
            //   detail,
            // );
          }
        }
      }
      if (res.locals.activity) {
        try {
          io.to('admin').emit('updateActivity', {
            activity: res.locals.activity,
          });
        } catch (e) {
          console.log(e);
        }
      }
    },
  );

  app.post(
    '/api/rpc/walletnotify/tokel',
    localhostOnly,
    walletNotifyTokel,
    async (req, res) => {
      if (res.locals.error) {
        console.log(res.locals.error);
      } else if (!res.locals.error
        && res.locals.detail
        && res.locals.detail.length > 0
      ) {
        for await (const detail of res.locals.detail) {
          if (detail.amount) {
            // await incomingDepositMessageHandler(
            //   discordClient,
            //   telegramClient,
            //   matrixClient,
            //   detail,
            // );
          }
        }
      }
      if (res.locals.activity) {
        try {
          io.to('admin').emit('updateActivity', {
            activity: res.locals.activity,
          });
        } catch (e) {
          console.log(e);
        }
      }
      res.sendStatus(200);
    },
  );



};
