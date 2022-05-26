/* eslint-disable no-restricted-syntax */
import walletNotifyRunebase from '../helpers/blockchain/runebase/walletNotify';
import walletNotifyPirate from '../helpers/blockchain/pirate/walletNotify';
import walletNotifyTokel from '../helpers/blockchain/tokel/walletNotify';

import { startRunebaseSync } from "../services/syncRunebase";
import { startPirateSync } from "../services/syncPirate";
import { startTokelSync } from "../services/syncTokel";

// import { incomingDepositMessageHandler } from '../helpers/messageHandlers';

const localhostOnly = (
  req,
  res,
  next,
) => {
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
  sockets,
  queue,
) => {
  app.post(
    '/api/rpc/blocknotify',
    localhostOnly,
    (req, res) => {
      console.log(req.body);
      if (req.body.ticker === 'RUNES') {
        startRunebaseSync(
          io,
          queue,
        );
      } else if (req.body.ticker === 'ARRR') {
        startPirateSync(
          io,
          queue,
        );
      } else if (req.body.ticker === 'TKL') {
        startTokelSync(
          io,
          queue,
        );
      }
      res.sendStatus(200);
    },
  );

  app.post(
    '/api/rpc/walletnotify',
    localhostOnly,
    async (req, res, next) => {
      if (req.body.ticker === 'RUNES') {
        walletNotifyRunebase(req, res, next);
      } else if (req.body.ticker === 'ARRR') {
        walletNotifyPirate(req, res, next);
      } else if (req.body.ticker === 'TKL') {
        walletNotifyTokel(req, res, next);
      }
      res.sendStatus(200);
    },
    async (req, res) => {
      if (res.locals.error) {
        console.log(res.locals.error);
      } else if (!res.locals.error
        && res.locals.detail
        && res.locals.detail.length > 0
      ) {
        for await (const detail of res.locals.detail) {
          console.log(detail.transaction);
          console.log('detail');
          if (detail.transaction) {
            io.to(detail.transaction.userId).emit(
              'insertTransaction',
              {
                result: detail.transaction,
              },
            );
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
};
