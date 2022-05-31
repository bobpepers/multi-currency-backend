import { Transaction } from "sequelize";
import { config } from "dotenv";
import db from '../models';
import { processWithdrawal } from "./processWithdrawal";
import { getPirateInstance } from "./rclient";

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
          },
        ],
      },
    ],
  });

  if (transaction && transaction.wallet.coin.ticker === 'ARRR') {
    const amountOfPirateCoinsAvailable = await getPirateInstance().zGetBalance(process.env.PIRATE_CONSOLIDATION_ADDRESS);
    if (amountOfPirateCoinsAvailable < (transaction.amount / 1e8)) {
      console.log('not enough pirate coins available at the moment');
      return;
    }
  }

  await db.sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  }, async (t) => {
    let updatedTrans;
    let updatedStellarWallet;

    if (!transaction) {
      console.log('No withdrawal to process');
      return;
    }
    if (transaction) {
      const [
        response,
        responseStatus,
        updatedWallet,
      ] = await processWithdrawal(
        transaction,
        io,
        t,
      );
      if (updatedWallet) {
        updatedStellarWallet = updatedWallet;
      }

      if (
        responseStatus
        && (
          responseStatus === 500
          || responseStatus === 504
        )
      ) {
        updatedTrans = await transaction.update(
          {
            // txid: response,
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
        return;
      }

      if (response) {
        if (
          transaction.wallet.coin.ticker === 'XLM'
          || transaction.wallet.coin.ticker === 'DXLM'
        ) {
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
          const activity = await db.activity.create(
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
          const activity = await db.activity.create(
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
        }
      }
    }

    t.afterCommit(async () => {
      if (updatedStellarWallet) {
        io.to(updatedStellarWallet.userId).emit(
          'updateWallet',
          {
            result: updatedStellarWallet,
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
        // txid: response,
        phase: 'failed',
        type: 'send',
      },
    );
  });
};
