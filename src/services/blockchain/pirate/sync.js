/* eslint-disable no-restricted-syntax */
/* eslint no-underscore-dangle: [2, { "allow": ["_eventName", "_address", "_time", "_orderId"] }] */
import _ from "lodash";
import { Transaction } from "sequelize";
import { config } from "dotenv";
import BigNumber from "bignumber.js";
import db from '../../../models';
import { getPirateInstance } from "../rclient";
// import { waterFaucet } from "../helpers/waterFaucet";
import blockchainConfig from '../../../config/blockchain_config';
import { sequentialLoop } from '../sequentialLoop';
import logger from "../../../helpers/logger";

config();

let isSyncing = false;

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
                  include: [
                    {
                      model: db.coin,
                      as: 'coin',
                      where: {
                        ticker: 'ARRR',
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
            if (processTransaction) {
              const wallet = await db.wallet.findOne({
                where: {
                  userId: processTransaction.wallet.userId,
                  id: processTransaction.wallet.id,
                },
                transaction: t,
                lock: t.LOCK.UPDATE,
              });

              if (transaction.confirmations < Number(blockchainConfig.pirate.confirmations)) {
                updatedTransaction = await processTransaction.update({
                  confirmations: transaction.rawconfirmations,
                }, {
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                });
              }

              if (transaction.confirmations >= Number(blockchainConfig.pirate.confirmations)) {
                const removeLockedAmount = new BigNumber(detail.amount).times(1e8).plus(processTransaction.feeAmount).times('-1');

                updatedWallet = await wallet.update({
                  locked: new BigNumber(wallet.locked).minus(removeLockedAmount).toString(),
                }, {
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                });
                updatedTransaction = await processTransaction.update({
                  confirmations: transaction.rawconfirmations > 30000 ? 30000 : transaction.rawconfirmations,
                  phase: 'confirmed',
                }, {
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                });
                const createActivity = await db.activity.create({
                  spenderId: updatedWallet.userId,
                  type: 'withdrawComplete',
                  amount: new BigNumber(detail.value).times(1e8).toString(),
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
                  id: processTransaction.wallet.id,
                },
                transaction: t,
                lock: t.LOCK.UPDATE,
              });

              if (transaction.confirmations < Number(blockchainConfig.pirate.confirmations)) {
                updatedTransaction = await processTransaction.update({
                  confirmations: transaction.rawconfirmations,
                }, {
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                });
              }
              if (transaction.confirmations >= Number(blockchainConfig.pirate.confirmations)) {
                console.log('updating balance');
                updatedWallet = await wallet.update({
                  available: new BigNumber(wallet.available).plus(new BigNumber(detail.value).times(1e8)).toString(),
                }, {
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                });
                updatedTransaction = await processTransaction.update({
                  confirmations: transaction.rawconfirmations > 30000 ? 30000 : transaction.rawconfirmations,
                  phase: 'confirmed',
                }, {
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                });
                const createActivity = await db.activity.create({
                  earnerId: updatedWallet.userId,
                  type: 'depositComplete',
                  amount: new BigNumber(detail.value).times(1e8).toString(),
                  earner_balance: new BigNumber(updatedWallet.available).plus(updatedWallet.locked).toString(),
                  transactionId: updatedTransaction.id,
                }, {
                  transaction: t,
                  lock: t.LOCK.UPDATE,
                });
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
          });
        }
      }
    }
  }
};

const insertBlock = async (startBlock) => {
  let success = false;
  await db.sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  }, async (t) => {
    const blockHash = await getPirateInstance().getBlockHash(startBlock);
    if (blockHash) {
      const block = getPirateInstance().getBlock(blockHash, 2);
      if (block) {
        const dbBlock = await db.pirateBlock.findOne({
          where: {
            id: Number(startBlock),
          },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (dbBlock) {
          await dbBlock.update({
            id: Number(startBlock),
            blockTime: block.time,
          }, {
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
        }
        if (!dbBlock) {
          await db.pirateBlock.create({
            id: startBlock,
            blockTime: block.time,
          }, {
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
        }
        success = true;
      }
    }
    return true;
  }).catch(async (err) => {
    success = false;
    try {
      await db.error.create({
        type: 'sync block',
        error: `${err}`,
      });
    } catch (e) {
      logger.error(`Error sync: ${e}`);
    }
    console.log(err);
    logger.error(`sync block: ${err}`);
  });

  if (success === true) {
    return true;
  }
  return false;
};

export const startPirateSync = async (
  io,
  queue,
) => {
  if (isSyncing) {
    console.log('Pirate Is Already Syncing');
    return;
  }
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
    order: [
      [
        'id',
        'DESC',
      ],
    ],
  });

  if (blocks.length > 0) {
    startBlock = Math.max(blocks[0].id + 1, startBlock);
  }

  const numOfIterations = Math.ceil(((currentBlockCount - startBlock) + 1) / 1);

  await sequentialLoop(
    numOfIterations,
    async (loop) => {
      isSyncing = true;
      const endBlock = Math.min((startBlock + 1) - 1, currentBlockCount);
      const successBlockSync = await insertBlock(startBlock);
      await queue.add(async () => {
        const task = await syncTransactions(io);
      });
      console.log('Inserted block: ', endBlock);
      if (successBlockSync) {
        startBlock = endBlock + 1;
      }
      await loop.next();
    },
    async () => {
      isSyncing = false;
    },
  );
};
