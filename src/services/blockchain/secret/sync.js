/* eslint-disable no-restricted-syntax */
import _ from "lodash";
import { Transaction } from "sequelize";
import BigNumber from "bignumber.js";
import db from '../../../models';
import blockchainConfig from '../../../config/blockchain_config';
// import { waterFaucet } from "../helpers/waterFaucet";
import { getSecretjsInstance } from '../rclient';
import logger from "../../../helpers/logger";
import { sequentialLoop } from '../sequentialLoop';

const syncTransactions = async (
  io,
  secretjs,
  blockHeight,
) => {
  const transactions = await db.transaction.findAll({
    where: {
      phase: 'confirming',
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
              ticker: 'SCRT',
            },
          },
        ],
      },
      {
        model: db.address,
        as: 'address',
      },
    ],
  });

  for await (const trans of transactions) {
    const transaction = await secretjs.query.getTx(trans.txid);
    if (transaction) {
      const txHash = transaction.transactionHash;
      const transferLog = transaction.jsonLog[0].events.find((x) => x.type === 'transfer');
      const recipient = transferLog.attributes.find((x) => x.key === 'recipient');
      const sender = transferLog.attributes.find((x) => x.key === 'sender');
      const amountSecond = transferLog.attributes.find((x) => x.key === 'amount');
      let updatedTransaction;
      let updatedWallet;
      if (amountSecond.value.endsWith('uscrt')) {
        const cleanedAmount = amountSecond.value.replace('uscrt', '');
        const isNum = /^\d+$/.test(cleanedAmount);
        if (isNum) {
          const realAmount = new BigNumber(cleanedAmount).dividedBy(1e6);
          const amountToCredit = realAmount.times(1e8);

          await db.sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
          }, async (t) => {
            const processTransaction = await db.transaction.findOne({
              where: {
                phase: 'confirming',
                id: trans.id,
              },
              include: [
                {
                  model: db.wallet,
                  as: 'wallet',
                  include: [{
                    model: db.coin,
                    as: 'coin',
                    where: {
                      ticker: 'SCRT',
                    },
                  }],
                },
                {
                  model: db.address,
                  as: 'address',
                  required: false,
                },
              ],
            });
            if (processTransaction) {
              const wallet = await db.wallet.findOne({
                where: {
                  userId: processTransaction.wallet.userId,
                  id: processTransaction.wallet.id,
                },
                transaction: t,
                lock: t.LOCK.UPDATE,
              });
              const currentConfirmations = blockHeight - transaction.height;

              if (currentConfirmations < Number(blockchainConfig.secret.confirmations)) {
                updatedTransaction = await processTransaction.update({
                  confirmations: currentConfirmations,
                }, {
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                });
              }

              if (currentConfirmations >= Number(blockchainConfig.secret.confirmations)) {
                if (
                  recipient.value === process.env.SECRET_ADDRESS
                    && processTransaction.type === 'receive'
                    && recipient.value === processTransaction.address.address
                    && amountToCredit.toString() === processTransaction.amount
                    && txHash === processTransaction.txid
                ) {
                  console.log('received transaction');
                  updatedWallet = await wallet.update({
                    available: new BigNumber(wallet.available).plus(new BigNumber(amountToCredit)).toString(),
                  }, {
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                  });
                  updatedTransaction = await trans.update({
                    confirmations: currentConfirmations > 30000 ? 30000 : currentConfirmations,
                    phase: 'confirmed',
                  }, {
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                  });
                  const createActivity = await db.activity.create({
                    earnerId: updatedWallet.userId,
                    type: 'depositComplete',
                    amount: new BigNumber(amountToCredit).toString(),
                    earner_balance: new BigNumber(updatedWallet.available).plus(updatedWallet.locked).toString(),
                    transactionId: updatedTransaction.id,
                  }, {
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                  });
                }
                // console.log(sender);
                // console.log(process.env.SECRET_ADDRESS);
                // console.log(amountToCredit.toString());
                // console.log(new BigNumber(processTransaction.amount).minus(processTransaction.feeAmount).toString());
                // console.log(txHash);
                // console.log(processTransaction.txid);
                if (
                  sender.value === process.env.SECRET_ADDRESS
                  && processTransaction.type === 'send'
                  && amountToCredit.toString() === new BigNumber(processTransaction.amount).minus(processTransaction.feeAmount).toString()
                  && txHash === processTransaction.txid
                ) {
                  updatedWallet = await wallet.update({
                    locked: new BigNumber(wallet.locked).minus(amountToCredit).toString(),
                  }, {
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                  });

                  updatedTransaction = await processTransaction.update({
                    confirmations: currentConfirmations > 30000 ? 30000 : currentConfirmations,
                    phase: 'confirmed',
                  }, {
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                  });

                  const createActivity = await db.activity.create({
                    spenderId: updatedWallet.userId,
                    type: 'withdrawComplete',
                    amount: new BigNumber(amountToCredit).minus(processTransaction.feeAmount).toString(),
                    spender_balance: new BigNumber(updatedWallet.available).plus(updatedWallet.locked).toString(),
                    transactionId: updatedTransaction.id,
                  }, {
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                  });

                  // const faucetSetting = await db.features.findOne({
                  //   where: {
                  //     type: 'global',
                  //     name: 'faucet',
                  //   },
                  //   transaction: t,
                  //   lock: t.LOCK.UPDATE,
                  // });

                  // const faucetWatered = await waterFaucet(
                  //   t,
                  //   Number(processTransaction.feeAmount),
                  //   faucetSetting,
                  // );
                }
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
              if (updatedTransaction) {
                io.to(updatedTransaction.userId).emit(
                  'updateTransaction',
                  {
                    result: updatedTransaction,
                  },
                );
              }
            });
          }).catch(async (err) => {
            try {
              await db.error.create({
                type: 'sync',
                error: `${err}`,
              });
            } catch (e) {
              logger.error(`Error sync: ${e}`);
            }
            console.log(err);
            logger.error(`Error sync: ${err}`);
          });
        }
      }
    }
  }
};

export const startSecretSync = async (
  io,
  queue,
  latestBlock,
) => {
  let secretjs;
  try {
    secretjs = await getSecretjsInstance();
  } catch (e) {
    console.log('startSecretSyncError');
    console.log(e);
    return;
  }

  if (latestBlock) {
    await queue.add(async () => {
      const task = await syncTransactions(
        io,
        secretjs,
        Number(latestBlock),
      );
    });
  }
};
