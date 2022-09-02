/* eslint-disable no-restricted-syntax */
import { Transaction } from "sequelize";
import { config } from "dotenv";
import BigNumber from "bignumber.js";
import db from '../../../models';
import { getPirateInstance } from "../../../services/rclient";

config();

export async function patchPirateDeposits() {
  try {
    await getPirateInstance().getBlockchainInfo();
  } catch (e) {
    console.log(e);
    return;
  }
  const transactions = await getPirateInstance().listTransactions(500);

  for await (const trans of transactions) {
    if (
      trans.received
      && trans.received.length > 0
    ) {
      for await (const detail of trans.received) {
        if (detail.address) {
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
                        ticker: 'ARRR',
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
                    type: 'receive',
                    userId: address.wallet.userId,
                    walletId: address.wallet.id,
                  },
                  defaults: {
                    txid: trans.txid,
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
                t.afterCommit(() => {
                  console.log('commited');
                });
              });
            }
          }
        }
      }
    }
  }
}
