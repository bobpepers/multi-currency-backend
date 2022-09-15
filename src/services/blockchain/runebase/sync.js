/* eslint-disable no-restricted-syntax */
import _ from "lodash";
import { Transaction } from "sequelize";
import BigNumber from "bignumber.js";
import db from '../../../models';
import blockchainConfig from '../../../config/blockchain_config';
import { getRunebaseInstance } from "../rclient";
// import { waterFaucet } from "../helpers/waterFaucet";
import logger from "../../../helpers/logger";
import { sequentialLoop } from '../sequentialLoop';

let isSyncing = false;

const syncTransactions = async (io) => {
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
              ticker: 'RUNES',
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
    const transaction = await getRunebaseInstance().getTransaction(trans.txid);

    for await (const detail of transaction.details) {
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
                  ticker: 'RUNES',
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

          if (transaction.confirmations < Number(blockchainConfig.runebase.confirmations)) {
            updatedTransaction = await processTransaction.update({
              confirmations: transaction.confirmations,
            }, {
              transaction: t,
              lock: t.LOCK.UPDATE,
            });
          }
          if (transaction.confirmations >= Number(blockchainConfig.runebase.confirmations)) {
            if (
              detail.category === 'send'
              && processTransaction.type === 'send'
            ) {
              const removeLockedAmount = new BigNumber(detail.amount).times(1e8).minus(processTransaction.feeAmount).times('-1');

              updatedWallet = await wallet.update({
                locked: new BigNumber(wallet.locked).minus(removeLockedAmount).toString(),
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
                amount: new BigNumber(detail.amount).times(1e8).toString(),
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
            if (
              detail.category === 'receive'
              && processTransaction.type === 'receive'
              && detail.address === processTransaction.address.address
            ) {
              updatedWallet = await wallet.update({
                available: new BigNumber(wallet.available).plus(new BigNumber(detail.amount).times(1e8)).toString(),
              }, {
                transaction: t,
                lock: t.LOCK.UPDATE,
              });
              updatedTransaction = await trans.update({
                confirmations: transaction.confirmations > 30000 ? 30000 : transaction.confirmations,
                phase: 'confirmed',
              }, {
                transaction: t,
                lock: t.LOCK.UPDATE,
              });
              const createActivity = await db.activity.create({
                earnerId: updatedWallet.userId,
                type: 'depositComplete',
                amount: new BigNumber(detail.amount).times(1e8).toString(),
                earner_balance: new BigNumber(updatedWallet.available).plus(updatedWallet.locked).toString(),
                transactionId: updatedTransaction.id,
              }, {
                transaction: t,
                lock: t.LOCK.UPDATE,
              });
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
  // return true;
};

const insertBlock = async (startBlock) => {
  let success = false;
  await db.sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  }, async (t) => {
    const blockHash = await getRunebaseInstance().getBlockHash(startBlock);
    if (blockHash) {
      const block = getRunebaseInstance().getBlock(blockHash, 2);
      if (block) {
        const dbBlock = await db.runebaseBlock.findOne({
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
          await db.runebaseBlock.create({
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

export const startRunebaseSync = async (
  io,
  queue,
) => {
  if (isSyncing) {
    console.log('Runebase Is Already Syncing');
    return;
  }
  try {
    await getRunebaseInstance().getBlockchainInfo();
  } catch (e) {
    console.log(e);
    return;
  }
  const currentBlockCount = Math.max(0, await getRunebaseInstance().getBlockCount());
  let startBlock = Number(blockchainConfig.runebase.startSyncBlock);

  const blocks = await db.runebaseBlock.findAll({
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
