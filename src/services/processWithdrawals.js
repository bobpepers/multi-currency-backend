import { Transaction } from "sequelize";
import { config } from "dotenv";
import db from '../models';
import { processWithdrawal } from "./processWithdrawal";
import { getPirateInstance } from "./rclient";

config();

export const processWithdrawals = async () => {
  console.log('proc1');
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
            model: db.user,
            as: 'user',
          },
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

    if (!transaction) {
      console.log('No withdrawal to process');
      return;
    }
    if (transaction) {
      const [
        response,
        responseStatus,
      ] = await processWithdrawal(transaction);

      if (responseStatus && responseStatus === 500) {
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
            spenderId: transaction.address.wallet.userId,
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
            spenderId: transaction.wallet.userId,
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

    t.afterCommit(async () => {
      console.log('withdraw function complete');
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
