/* eslint-disable no-restricted-syntax */
import { Transaction } from "sequelize";
import BigNumber from "bignumber.js";
import db from '../../../models';

import { getRunebaseInstance } from "../../rclient";

export async function patchRunebaseDeposits() {
  try {
    await getRunebaseInstance().getBlockchainInfo();
  } catch (e) {
    console.log(e);
    return;
  }
  const transactions = await getRunebaseInstance().listTransactions(1000);

  for await (const trans of transactions) {
    if (trans.category === 'receive') {
      if (trans.address) {
        const address = await db.address.findOne({
          where: {
            address: trans.address,
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
                    ticker: 'RUNES',
                  },
                },
              ],
            },
          ],
        });

        if (address) {
          await db.sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
          }, async (t) => {
            const newTrans = await db.transaction.findOrCreate({
              where: {
                txid: trans.txid,
                type: trans.category,
                userId: address.wallet.userId,
                walletId: address.wallet.id,
              },
              defaults: {
                txid: trans.txid,
                addressId: address.id,
                phase: 'confirming',
                type: trans.category,
                amount: new BigNumber(trans.amount).times(1e8).toString(),
                userId: address.wallet.userId,
                walletId: address.wallet.id,
                coinId: address.wallet.coinId,
              },
              transaction: t,
              lock: t.LOCK.UPDATE,
            });

            t.afterCommit(() => {
              console.log('commited');
            });
          });
        }
      }
    }
  }
}
