import { Transaction } from "sequelize";
import { config } from "dotenv";
import BigNumber from "bignumber.js";
import db from '../models';
import { getPirateInstance } from "./rclient";
import { withdrawRUNES } from './processWithdrawal/runes';
import { withdrawTKL } from './processWithdrawal/tkl';
import { withdrawARRR } from './processWithdrawal/arrr';
import { withdrawXLM } from './processWithdrawal/xlm';
import { withdrawDXLM } from './processWithdrawal/dxlm';

config();

export const processWithdrawals = async (
  io,
) => {
  const transaction = await db.transaction.findOne({
    where: {
      phase: 'review',
    },
    include: [
      {
        model: db.wallet,
        as: 'wallet',
        include: [
          {
            model: db.coin,
            as: 'coin',
            include: [
              {
                model: db.withdrawalSetting,
                as: 'withdrawalSetting',
                where: {
                  enabled: true,
                },
              },
            ],
          },
        ],
      },
    ],
  });

  if (!transaction) {
    console.log('No withdrawal to process');
    return;
  }

  if (transaction && transaction.wallet.coin.ticker === 'ARRR') {
    const amountOfPirateCoinsAvailable = await getPirateInstance().zGetBalance(process.env.PIRATE_CONSOLIDATION_ADDRESS);
    if (amountOfPirateCoinsAvailable < new BigNumber(transaction.amount).dividedBy(1e8)) {
      console.log('not enough pirate coins available at the moment');
      return;
    }
  }

  await db.sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  }, async (t) => {
    let updatedTrans;
    let updatedWallet;
    let response;
    let responseStatus;
    const activity = [];

    if (transaction) {
      const amount = new BigNumber(transaction.amount).minus(transaction.feeAmount).dividedBy(1e8);
      // const amount = ((transaction.amount - Number(transaction.feeAmount)) / 1e8);
      if (transaction.wallet.coin.ticker === 'RUNES') {
        [
          response,
          responseStatus,
        ] = await withdrawRUNES(
          transaction,
          amount,
        );
      }
      if (transaction.wallet.coin.ticker === 'ARRR') {
        [
          response,
          responseStatus,
        ] = await withdrawARRR(
          transaction,
          amount,
        );
      }
      if (transaction.wallet.coin.ticker === 'TKL') {
        [
          response,
          responseStatus,
        ] = await withdrawTKL(
          transaction,
          amount,
        );
      }
      if (transaction.wallet.coin.ticker === 'XLM') {
        [
          response,
          responseStatus,
        ] = await withdrawXLM(
          transaction,
          amount,
        );
      }
      if (transaction.wallet.coin.ticker === 'DXLM') {
        [
          response,
          responseStatus,
        ] = await withdrawDXLM(
          transaction,
          amount,
        );
      }

      if (
        transaction.wallet.coin.ticker === 'XLM'
        || transaction.wallet.coin.ticker === 'DXLM'
      ) {
        if (
          responseStatus
          && (
            responseStatus === 504
            // || responseStatus === 500
          )
        ) {
          console.log('time-out');
          return;
        }
      }

      if (response) {
        if (
          transaction.wallet.coin.ticker === 'XLM'
          || transaction.wallet.coin.ticker === 'DXLM'
        ) {
          const wallet = await db.wallet.findOne({
            where: {
              id: transaction.wallet.id,
            },
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
          updatedWallet = await wallet.update({
            locked: new BigNumber(wallet.locked).minus(transaction.amount).toString(),
          }, {
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
          updatedTrans = await transaction.update(
            {
              txid: response.hash ? response.hash : '',
              phase: 'confirmed',
              type: 'send',
              confirmations: 1,
            },
            {
              transaction: t,
              lock: t.LOCK.UPDATE,
            },
          );
          const newActivity = await db.activity.create(
            {
              spenderId: transaction.userId,
              type: 'withdrawComplete',
              transactionId: transaction.id,
            },
            {
              transaction: t,
              lock: t.LOCK.UPDATE,
            },
          );
          activity.unshift(newActivity);
        } else {
          updatedTrans = await transaction.update(
            {
              txid: response,
              phase: 'confirming',
              type: 'send',
            },
            {
              transaction: t,
              lock: t.LOCK.UPDATE,
            },
          );
          const newFailActivity = await db.activity.create(
            {
              spenderId: transaction.userId,
              type: 'withdrawAccepted',
              transactionId: transaction.id,
            },
            {
              transaction: t,
              lock: t.LOCK.UPDATE,
            },
          );
          activity.unshift(newFailActivity);
        }
      } else {
        updatedTrans = await transaction.update(
          {
            phase: 'failed',
            type: 'send',
          },
          {
            transaction: t,
            lock: t.LOCK.UPDATE,
          },
        );
        const activityF = await db.activity.create(
          {
            spenderId: transaction.userId,
            type: 'withdraw_f',
            transactionId: transaction.id,
          },
          {
            transaction: t,
            lock: t.LOCK.UPDATE,
          },
        );
        activity.unshift(activityF);
      }

      if (
        responseStatus
        && (
          responseStatus === 500
          || responseStatus === 504
        )
      ) {
        console.log('failed');
        return;
      }
    }

    t.afterCommit(async () => {
      if (updatedWallet) {
        io.to(updatedWallet.userId).emit(
          'updateWallet',
          {
            result: updatedWallet,
          },
        );
      }
      if (updatedTrans) {
        io.to(updatedTrans.userId).emit(
          'updateTransaction',
          {
            result: updatedTrans,
          },
        );
      }
    });
  }).catch(async (err) => {
    console.log(err);
    await transaction.update(
      {
        phase: 'failed',
        type: 'send',
      },
    );
  });
};
