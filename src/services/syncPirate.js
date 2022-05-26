/* eslint-disable no-restricted-syntax */
/* eslint no-underscore-dangle: [2, { "allow": ["_eventName", "_address", "_time", "_orderId"] }] */
import _ from "lodash";
import { Transaction } from "sequelize";
import { config } from "dotenv";
import db from '../models';
import { getPirateInstance } from "./rclient";
// import { waterFaucet } from "../helpers/waterFaucet";
// import { isDepositOrWithdrawalCompleteMessageHandler } from '../helpers/messageHandlers';
import blockchainConfig from '../config/blockchain_config';

config();

const sequentialLoop = async (iterations, process, exit) => {
  let index = 0;
  let done = false;
  let shouldExit = false;

  const loop = {
    async next() {
      if (done) {
        if (shouldExit && exit) {
          return exit();
        }
      }

      if (index < iterations) {
        index += 1;
        await process(loop);
      } else {
        done = true;

        if (exit) {
          exit();
        }
      }
    },

    iteration() {
      return index - 1; // Return the loop number we're on
    },

    break(end) {
      done = true;
      shouldExit = end;
    },
  };
  await loop.next();
  return loop;
};

const syncTransactions = async (io) => {
  console.log('syncPirateTransactions');
  const transactions = await db.transaction.findAll({
    where: {
      phase: 'confirming',
    },
    include: [
      {
        model: db.wallet,
        as: 'wallet',
        required: true,
        include: [{
          model: db.coin,
          as: 'coin',
          required: true,
          where: {
            ticker: 'ARRR',
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
  console.log('syncPirateTransactions2');

  // eslint-disable-next-line no-restricted-syntax
  for await (const trans of transactions) {
    console.log('123');
    console.log(trans);
    const transaction = await getPirateInstance().getTransaction(trans.txid);
    console.log(transaction);
    if (
      transaction.sent
      && transaction.sent.length > 0
      && trans.type === 'send'
    ) {
      for await (const detail of transaction.sent) {
        if (
          detail.address !== process.env.PIRATE_CONSOLIDATION_ADDRESS
        ) {
          let isWithdrawalComplete = false;
          const isDepositComplete = false;
          let userToMessage;
          let updatedTransaction;
          let updatedWallet;
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
                      ticker: 'ARRR',
                    },
                  }],
                },
                {
                  model: db.address,
                  as: 'address',
                },
              ],
            });
            if (processTransaction) {
              const wallet = await db.wallet.findOne({
                where: {
                  userId: processTransaction.wallet.userId,
                },
                transaction: t,
                lock: t.LOCK.UPDATE,
              });

              if (transaction.confirmations < Number(blockchainConfig.pirate.confirmations)) {
                updatedTransaction = await processTransaction.update({
                  confirmations: transaction.confirmations,
                }, {
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                });
              }

              if (transaction.confirmations >= Number(blockchainConfig.pirate.confirmations)) {
                const prepareLockedAmount = ((detail.value * 1e8) + Number(processTransaction.feeAmount));
                const removeLockedAmount = Math.abs(prepareLockedAmount);

                updatedWallet = await wallet.update({
                  locked: wallet.locked - removeLockedAmount,
                }, {
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                });
                updatedTransaction = await processTransaction.update({
                  confirmations: transaction.confirmations > 30000 ? 30000 : transaction.confirmations,
                  phase: 'confirmed',
                }, {
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                });
                const createActivity = await db.activity.create({
                  spenderId: updatedWallet.userId,
                  type: 'withdrawComplete',
                  amount: detail.value * 1e8,
                  spender_balance: updatedWallet.available + updatedWallet.locked,
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

                userToMessage = await db.user.findOne({
                  where: {
                    id: updatedWallet.userId,
                  },
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                });
                isWithdrawalComplete = true;
              }
            }

            t.afterCommit(async () => {
              console.log('syncPirateTransactionsDone');
              // await isDepositOrWithdrawalCompleteMessageHandler(
              //   isDepositComplete,
              //   isWithdrawalComplete,
              //   discordClient,
              //   telegramClient,
              //   matrixClient,
              //   userToMessage,
              //   trans,
              //   detail.value,
              // );
            });
          });
        }
      }
    }

    if (transaction.received
      && transaction.received.length > 0
      && trans.type === 'receive'
    ) {
      for await (const detail of transaction.received) {
        if (
          detail.address !== process.env.PIRATE_CONSOLIDATION_ADDRESS
          && detail.address === trans.address.address
        ) {
          const isWithdrawalComplete = false;
          let isDepositComplete = false;
          let userToMessage;
          let updatedTransaction;
          let updatedWallet;
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
                      ticker: 'ARRR',
                    },
                  }],
                },
                {
                  model: db.address,
                  as: 'address',
                },
              ],
            });
            if (processTransaction) {
              const wallet = await db.wallet.findOne({
                where: {
                  userId: processTransaction.wallet.userId,
                },
                transaction: t,
                lock: t.LOCK.UPDATE,
              });

              if (transaction.confirmations < Number(blockchainConfig.pirate.confirmations)) {
                updatedTransaction = await processTransaction.update({
                  confirmations: transaction.confirmations,
                }, {
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                });
              }
              if (transaction.confirmations >= Number(blockchainConfig.pirate.confirmations)) {
                console.log('updating balance');
                updatedWallet = await wallet.update({
                  available: wallet.available + (detail.value * 1e8),
                }, {
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                });
                updatedTransaction = await processTransaction.update({
                  confirmations: transaction.confirmations > 30000 ? 30000 : transaction.confirmations,
                  phase: 'confirmed',
                }, {
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                });
                const createActivity = await db.activity.create({
                  earnerId: updatedWallet.userId,
                  type: 'depositComplete',
                  amount: detail.value * 1e8,
                  earner_balance: updatedWallet.available + updatedWallet.locked,
                  transactionId: updatedTransaction.id,
                }, {
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                });
                userToMessage = await db.user.findOne({
                  where: {
                    id: updatedWallet.userId,
                  },
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                });
                isDepositComplete = true;
              }
            }

            t.afterCommit(async () => {
              // await isDepositOrWithdrawalCompleteMessageHandler(
              //   isDepositComplete,
              //   isWithdrawalComplete,
              //   discordClient,
              //   telegramClient,
              //   matrixClient,
              //   userToMessage,
              //   trans,
              //   detail.value,
              // );
            });
          });
        }
      }
    }
  }
  // return true;
};

const insertBlock = async (startBlock) => {
  try {
    const blockHash = await getPirateInstance().getBlockHash(startBlock);
    if (blockHash) {
      const block = getPirateInstance().getBlock(blockHash, 2);
      if (block) {
        const dbBlock = await db.pirateBlock.findOne({
          where: {
            id: Number(startBlock),
          },
        });
        if (dbBlock) {
          await dbBlock.update({
            id: Number(startBlock),
            blockTime: block.time,
          });
        }
        if (!dbBlock) {
          await db.pirateBlock.create({
            id: startBlock,
            blockTime: block.time,
          });
        }
      }
    }
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
};

export const startPirateSync = async (
  io,
  queue,
) => {
  try {
    await getPirateInstance().getBlockchainInfo();
  } catch (e) {
    console.log(e);
    return;
  }
  const currentBlockCount = Math.max(0, await getPirateInstance().getBlockCount());
  let startBlock = Number(blockchainConfig.pirate.startSyncBlock);
  const blocks = await db.pirateBlock.findAll({
    limit: 1,
    order: [['id', 'DESC']],
  });

  if (blocks.length > 0) {
    startBlock = Math.max(blocks[0].id + 1, startBlock);
  }

  const numOfIterations = Math.ceil(((currentBlockCount - startBlock) + 1) / 1);

  await sequentialLoop(
    numOfIterations,
    async (loop) => {
      const endBlock = Math.min((startBlock + 1) - 1, currentBlockCount);

      await queue.add(async () => {
        const task = await syncTransactions(io);
      });

      await queue.add(async () => {
        const task = await insertBlock(startBlock);
      });

      startBlock = endBlock + 1;
      await loop.next();
    },
    async () => {
      console.log('Synced block');
      // setTimeout(startSync, 5000);
    },
  );
};
