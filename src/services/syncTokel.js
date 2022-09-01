/* eslint-disable no-restricted-syntax */
/* eslint-disable no-loop-func */
/* eslint no-underscore-dangle: [2, { "allow": ["_eventName", "_address", "_time", "_orderId"] }] */
import _ from "lodash";
import { Transaction } from "sequelize";
import BigNumber from "bignumber.js";
import db from '../models';
import blockchainConfig from '../config/blockchain_config';
import { getTokelInstance } from "./rclient";
// import { waterFaucet } from "../helpers/waterFaucet";
import logger from "../helpers/logger";

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
            ticker: 'TKL',
          },
        }],
      },
      {
        model: db.address,
        as: 'address',
      },
    ],
  });

  for await (const trans of transactions) {
    const transaction = await getTokelInstance().getTransaction(trans.txid);

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
              model: db.addressExternal,
              as: 'addressExternal',
              required: false,
            },
            {
              model: db.wallet,
              as: 'wallet',
              include: [{
                model: db.coin,
                as: 'coin',
                required: true,
                where: {
                  ticker: 'TKL',
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
          console.log(wallet);
          console.log('process Transaction wallet');

          if (transaction.confirmations < Number(blockchainConfig.tokel.confirmations)) {
            updatedTransaction = await processTransaction.update({
              confirmations: transaction.rawconfirmations,
            }, {
              transaction: t,
              lock: t.LOCK.UPDATE,
            });
            console.log(transaction);
            console.log(processTransaction);
            console.log(detail);
            console.log(processTransaction.address.address);
            console.log('add confirmation');
          }
          if (transaction.confirmations >= Number(blockchainConfig.tokel.confirmations)) {
            if (
              detail.category === 'send'
              && processTransaction.type === 'send'
              && processTransaction.addressExternal
              && processTransaction.addressExternal.address
              && processTransaction.addressExternal.address === detail.address
            ) {
              const removeLockedAmount = new BigNumber(detail.amount).times(1e8).minus(processTransaction.feeAmount).times('-1');

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
                amount: new BigNumber(detail.amount).times(1e8).toString(),
                spender_balance: new BigNumber(updatedWallet.available).plus(updatedWallet.locked),
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
              console.log('final confirm receive');
              console.log(detail.amount);
              updatedWallet = await wallet.update({
                available: new BigNumber(wallet.available).plus(new BigNumber(detail.amount).times(1e8)).toString(),
              }, {
                transaction: t,
                lock: t.LOCK.UPDATE,
              });
              console.log('updatedWallet');
              console.log(updatedWallet);
              updatedTransaction = await trans.update({
                confirmations: transaction.rawconfirmations > 30000 ? 30000 : transaction.rawconfirmations,
                phase: 'confirmed',
              }, {
                transaction: t,
                lock: t.LOCK.UPDATE,
              });
              const createActivity = await db.activity.create({
                earnerId: updatedWallet.userId,
                type: 'depositComplete',
                amount: new BigNumber(detail.amount).times(1e8).toString(),
                earner_balance: new BigNumber(updatedWallet.available).plus(updatedWallet.locked),
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
  return true;
};

const insertBlock = async (startBlock) => {
  try {
    const blockHash = await getTokelInstance().getBlockHash(startBlock);
    if (blockHash) {
      const block = getTokelInstance().getBlock(blockHash, 2);
      if (block) {
        const dbBlock = await db.tokelBlock.findOne({
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
          await db.tokelBlock.create({
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

export const startTokelSync = async (
  io,
  queue,
) => {
  try {
    await getTokelInstance().getBlockchainInfo();
  } catch (e) {
    console.log(e);
    return;
  }
  const currentBlockCount = Math.max(0, await getTokelInstance().getBlockCount());
  let startBlock = Number(blockchainConfig.tokel.startSyncBlock);

  const blocks = await db.tokelBlock.findAll({
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
    },
  );
};
