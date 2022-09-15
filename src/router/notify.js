/* eslint-disable no-restricted-syntax */
import StellarSdk from 'stellar-sdk';
import { config } from "dotenv";
import fs from 'fs';
import walletNotifyRunebase from '../services/blockchain/runebase/walletNotify';
import walletNotifyPirate from '../services/blockchain/pirate/walletNotify';
import walletNotifyTokel from '../services/blockchain/tokel/walletNotify';
import walletNotifySecret from '../services/blockchain/secret/walletNotify';
import walletNotifyLumens from '../services/blockchain/stellar/walletNotify';

import { startRunebaseSync } from "../services/blockchain/runebase/sync";
import { startPirateSync } from "../services/blockchain/pirate/sync";
import { startTokelSync } from "../services/blockchain/tokel/sync";

config();

const server = new StellarSdk.Server("https://horizon.stellar.org");
const stellarPayments = server.payments().forAccount(process.env.STELLAR_PUBLIC);

function savePagingToken(token) {
  fs.writeFile('.stellar/stellarPagingToken', token, (error) => {
    if (error) throw error;
  });
}

function loadLastPagingToken() {
  fs.readFile('.stellar/stellarPagingToken', (error, txtString) => {
    if (error) throw error;
    return txtString.toString();
  });
}

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
  // Traditional Blockchain RUNES/ARRR/TKL
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

  // Stellar blockchain
  const lastStellarToken = loadLastPagingToken();
  if (lastStellarToken) {
    stellarPayments.cursor(lastStellarToken);
  }

  stellarPayments.stream({
    async onmessage(payment) {
      savePagingToken(payment.paging_token);

      if (payment.to !== process.env.STELLAR_PUBLIC) {
        return;
      }
      if (payment.from === process.env.STELLAR_PUBLIC) {
        return;
      }

      const transactionInfo = await payment.transaction();

      if (!transactionInfo.successful) {
        return;
      }

      let asset;
      if (payment.asset_type === "native") {
        asset = "XLM";
        await queue.add(async () => {
          const task = walletNotifyLumens(
            payment,
            transactionInfo,
            io,
            asset,
          );
        });
      } else if (
        payment.asset_code === 'DXLM'
        && payment.asset_issuer === 'GAE6DWVMZDAOBU4IIPGDM2EJ65PWZQ5X7MI7PUURWKTEVZSEJHRYI247'
      ) {
        asset = "DXLM";
        await queue.add(async () => {
          const task = walletNotifyLumens(
            payment,
            transactionInfo,
            io,
            asset,
          );
        });
      }
    },
    onerror(error) {
      console.error("Error in payment stream");
    },
  });

  // Secret network
  walletNotifySecret(
    io,
    queue,
  );
};
