/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { Transaction } from 'sequelize';
import db from '../../models';
import {
  getRunebaseInstance,
  getPirateInstance,
  getTokelInstance,
} from '../../services/rclient';

export const createWalletsForUser = async (
  req,
  res,
  next,
) => {
  await db.sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  }, async (t) => {
    const coins = await db.coin.findAll();
    for (const coin of coins) {
      let wallet = await db.wallet.findOne({
        where: {
          userId: req.user.id,
          coinId: coin.id,
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!wallet) {
        wallet = await db.wallet.create({
          userId: req.user.id,
          coinId: coin.id,
          available: 0,
          locked: 0,
          spend: 0,
          earned: 0,
        }, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
      }
      if (wallet) {
        let address = await db.address.findOne({
          where: {
            walletId: wallet.id,
          },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!address) {
          if (coin.ticker === 'RUNES') {
            let newAddress;
            try {
              newAddress = await getRunebaseInstance().getNewAddress();
            } catch (e) {
              console.log(e);
            }
            if (newAddress) {
              const addressAlreadyExist = await db.address.findOne(
                {
                  where: {
                    address: newAddress,
                  },
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                },
              );
              if (!addressAlreadyExist) {
                address = await db.address.create({
                  address: newAddress,
                  walletId: wallet.id,
                }, {
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                });
              }
            }
          }
          if (coin.ticker === 'ARRR') {
            let newAddress;
            try {
              newAddress = await getPirateInstance().getNewAddress();
            } catch (e) {
              console.log(e);
            }
            if (newAddress) {
              const addressAlreadyExist = await db.address.findOne(
                {
                  where: {
                    address: newAddress,
                  },
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                },
              );
              if (!addressAlreadyExist) {
                address = await db.address.create({
                  address: newAddress,
                  walletId: wallet.id,
                }, {
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                });
              }
            }
          }
          if (coin.ticker === 'TKL') {
            let newAddress;
            try {
              newAddress = await getTokelInstance().getNewAddress();
            } catch (e) {
              console.log(e);
            }
            if (newAddress) {
              const addressAlreadyExist = await db.address.findOne(
                {
                  where: {
                    address: newAddress,
                  },
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                },
              );
              if (!addressAlreadyExist) {
                address = await db.address.create({
                  address: newAddress,
                  walletId: wallet.id,
                }, {
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                });
              }
            }
          }
          if (coin.ticker === 'XLM') {
            const addressAlreadyExist = await db.address.findOne(
              {
                where: {
                  address: process.env.STELLAR_PUBLIC,
                  memo: String(wallet.id),
                },
                transaction: t,
                lock: t.LOCK.UPDATE,
              },
            );
            if (!addressAlreadyExist) {
              address = await db.address.create({
                address: process.env.STELLAR_PUBLIC,
                memo: String(wallet.id),
                walletId: wallet.id,
              }, {
                transaction: t,
                lock: t.LOCK.UPDATE,
              });
            }
          }
          if (coin.ticker === 'DXLM') {
            const addressAlreadyExist = await db.address.findOne(
              {
                where: {
                  address: process.env.STELLAR_PUBLIC,
                  memo: String(wallet.id),
                },
                transaction: t,
                lock: t.LOCK.UPDATE,
              },
            );
            if (!addressAlreadyExist) {
              address = await db.address.create({
                address: process.env.STELLAR_PUBLIC,
                memo: String(wallet.id),
                walletId: wallet.id,
              }, {
                transaction: t,
                lock: t.LOCK.UPDATE,
              });
            }
          }
        }
      }
    }

    t.afterCommit(() => {
      next();
    });
  }).catch((err) => {
    console.log(err.message);
    next();
  });
};
