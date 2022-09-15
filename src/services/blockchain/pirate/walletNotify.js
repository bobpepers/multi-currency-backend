/* eslint-disable no-restricted-syntax */
import { Transaction } from "sequelize";
import { config } from "dotenv";
import BigNumber from "bignumber.js";
import { getPirateInstance } from '../rclient';
import db from '../../../models';

config();

/**
 * Notify New Transaction From Pirate Node
 */
const walletNotifyPirate = async (
  req,
  res,
  next,
) => {
  res.locals.activity = [];
  const txId = req.body.payload;

  await db.sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  }, async (t) => {
    let i = 0;
    res.locals.detail = [];
    const transaction = await getPirateInstance().getTransaction(txId);
    if (transaction.received && transaction.received.length > 0) {
      for await (const detail of transaction.received) {
        if (detail.address !== process.env.PIRATE_CONSOLIDATION_ADDRESS) {
          const address = await db.address.findOne({
            where: {
              address: detail.address,
            },
            include: [
              {
                model: db.wallet,
                as: 'wallet',
                include: [
                  {
                    model: db.coin,
                    as: 'coin',
                    required: true,
                    where: {
                      ticker: req.body.ticker,
                    },
                  },
                  {
                    model: db.user,
                    as: 'user',
                  },
                ],
              },
            ],
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
          if (address) {
            res.locals.detail[parseInt(i, 10)] = {};
            res.locals.detail[parseInt(i, 10)].userId = address.wallet.user.id;
            const newTransaction = await db.transaction.findOrCreate({
              where: {
                txid: transaction.txid,
                type: 'receive',
                userId: address.wallet.userId,
                walletId: address.wallet.id,
              },
              defaults: {
                txid: txId,
                addressId: address.id,
                phase: 'confirming',
                type: 'receive',
                amount: new BigNumber(detail.value).times(1e8).toString(),
                userId: address.wallet.userId,
                walletId: address.wallet.id,
                coinId: address.wallet.coinId,
              },
              transaction: t,
              lock: t.LOCK.UPDATE,
            });

            if (newTransaction[1]) {
              res.locals.detail[parseInt(i, 10)].transaction = await db.transaction.findOne({
                where: {
                  id: newTransaction[0].id,
                },
                include: [
                  {
                    model: db.wallet,
                    as: 'wallet',
                    include: [
                      {
                        model: db.coin,
                        as: 'coin',
                      },
                    ],
                  },
                ],
                transaction: t,
                lock: t.LOCK.UPDATE,
              });
              const activity = await db.activity.findOrCreate({
                where: {
                  transactionId: newTransaction[0].id,
                },
                defaults: {
                  earnerId: address.wallet.userId,
                  type: 'depositAccepted',
                  amount: new BigNumber(detail.value).times(1e8).toString(),
                  transactionId: newTransaction[0].id,
                },
                transaction: t,
                lock: t.LOCK.UPDATE,
              });
              res.locals.activity.unshift(activity[0]);
            }

            i += 1;
          }
        }
      }
    }

    t.afterCommit(() => {
      console.log('commited');
      next();
    });
  });
};

export default walletNotifyPirate;
