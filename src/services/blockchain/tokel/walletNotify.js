/* eslint-disable no-restricted-syntax */
import { Transaction } from "sequelize";
import BigNumber from "bignumber.js";
import { getTokelInstance } from '../rclient';
import db from '../../../models';

// import logger from "../../logger";

/**
 * Notify New Transaction From Tokel Node
 */
const walletNotifyTokel = async (
  req,
  res,
  next,
) => {
  res.locals.activity = [];
  const txId = req.body.payload;
  const transaction = await getTokelInstance().getTransaction(txId);

  await db.sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  }, async (t) => {
    let i = 0;
    res.locals.detail = [];
    if (transaction.details && transaction.details.length > 0) {
      for await (const detail of transaction.details) {
        if (detail.category === 'receive') {
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
          console.log(address);
          if (address) {
            res.locals.detail[parseInt(i, 10)] = {};
            res.locals.detail[parseInt(i, 10)].userId = address.wallet.user.id;
            const newTransaction = await db.transaction.findOrCreate({
              where: {
                txid: transaction.txid,
                type: detail.category,
                userId: address.wallet.userId,
                walletId: address.wallet.id,
              },
              defaults: {
                txid: txId,
                addressId: address.id,
                phase: 'confirming',
                type: detail.category,
                amount: new BigNumber(detail.amount).times(1e8).toString(),
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
                  amount: new BigNumber(detail.amount).times(1e8).toString(),
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
      next();
      console.log('commited');
    });
  });
};

export default walletNotifyTokel;
