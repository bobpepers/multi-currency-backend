/* eslint-disable no-restricted-syntax */
import { Transaction } from "sequelize";
import db from '../../../models';

/**
 * Notify New Transaction From Runebase Node
 */
const walletNotifyLumens = async (
  payment,
  transactionInfo,
  io,
  asset,
) => {
  const activity = [];
  let transaction;
  let updatedWallet;

  await db.sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  }, async (t) => {
    const amountToCredit = payment.amount * 1e8;
    const address = await db.address.findOne({
      where: {
        address: process.env.STELLAR_PUBLIC,
        memo: transactionInfo.memo ? transactionInfo.memo : 'missing memo',
      },
      include: [
        {
          model: db.wallet,
          as: 'wallet',
          required: true,
          include: [
            {
              model: db.coin,
              as: 'coin',
              required: true,
              where: {
                ticker: asset,
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
    const findCoin = await db.coin.findOne({
      where: {
        ticker: asset,
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!address) {
      if (findCoin) {
        const unknownTransaction = await db.transaction.findOrCreate({
          where: {
            txid: payment.transaction_hash,
            type: 'receive',
            coinId: findCoin.id,
          },
          defaults: {
            txid: payment.transaction_hash,
            phase: 'failed',
            type: 'receive',
            confirmations: 1,
            amount: amountToCredit,
            coinId: findCoin.id,
            memo: transactionInfo.memo ? transactionInfo.memo : 'missing memo',
          },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
      }
    }
    if (address) {
      if (findCoin) {
        const newTransaction = await db.transaction.findOrCreate({
          where: {
            txid: payment.transaction_hash,
            type: 'receive',
            userId: address.wallet.userId,
            walletId: address.wallet.id,
          },
          defaults: {
            txid: payment.transaction_hash,
            addressId: address.id,
            phase: 'confirmed',
            type: 'receive',
            confirmations: 1,
            amount: amountToCredit,
            userId: address.wallet.userId,
            walletId: address.wallet.id,
            coinId: findCoin.id,
            memo: payment.memo,
          },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (newTransaction[1]) {
          updatedWallet = await address.wallet.update({
            available: address.wallet.available + amountToCredit,
          }, {
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
          transaction = await db.transaction.findOne({
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
              type: 'depositComplete',
              amount: amountToCredit,
              transactionId: newTransaction[0].id,
            },
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
          activity.unshift(activity[0]);
        }
      }
    }

    t.afterCommit(() => {
      if (transaction) {
        io.to(transaction.userId).emit(
          'insertTransaction',
          {
            result: transaction,
          },
        );
      }
      if (updatedWallet) {
        io.to(updatedWallet.userId).emit(
          'updateWallet',
          {
            result: updatedWallet,
          },
        );
      }
    });
  });
};

export default walletNotifyLumens;
