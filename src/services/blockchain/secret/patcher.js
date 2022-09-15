import axios from 'axios';

/* eslint-disable no-restricted-syntax */
import { Transaction } from "sequelize";
import BigNumber from "bignumber.js";
import { getSecretjsInstance } from '../rclient';
import db from '../../../models';

// import logger from "../../logger";

/**
 * Patch Transaction From Secret
 */
export const patchSecretDeposits = async (
  io,
) => {
  try {
    const secretjs = await getSecretjsInstance();
    const latestBlock = await secretjs.query.tendermint.getLatestBlock({});
    const checkFromBlockHeight = Number(latestBlock.block.header.height) - 150000;
    const txs = await secretjs.query.txsQuery(`transfer.recipient = '${process.env.SECRET_ADDRESS}' AND tx.height >= ${checkFromBlockHeight}`);

    for await (const tx of txs) {
      const transfer = tx.jsonLog[0].events.find((x) => x.type === 'transfer');

      const txHash = tx.transactionHash;
      const recipient = transfer.attributes.find((x) => x.key === 'recipient');
      const sender = transfer.attributes.find((x) => x.key === 'sender');
      const amount = transfer.attributes.find((x) => x.key === 'amount');

      const findTransaction = await db.transaction.findOne({
        where: {
          txid: txHash,
        },
      });

      if (!findTransaction) {
        const fetchedTx = await secretjs.query.getTx(txHash);
        const txHashSecond = fetchedTx.transactionHash;
        const transferLog = fetchedTx.jsonLog[0].events.find((x) => x.type === 'transfer');
        const recipientSecond = transferLog.attributes.find((x) => x.key === 'recipient');
        const senderSecond = transferLog.attributes.find((x) => x.key === 'sender');
        const amountSecond = transferLog.attributes.find((x) => x.key === 'amount');
        const { memo } = fetchedTx.tx.body;
        if (
          amount.value.endsWith('uscrt')
          && amountSecond.value.endsWith('uscrt')
          && amount.value === amountSecond.value
          && sender.value === senderSecond.value
          && recipient.value === recipientSecond.value
          && txHash === txHashSecond
          && recipient.value === process.env.SECRET_ADDRESS
        ) {
          const cleanedAmount = amount.value.replace('uscrt', '');
          const isNum = /^\d+$/.test(cleanedAmount);
          if (isNum) {
            const realAmount = new BigNumber(cleanedAmount).dividedBy(1e6);
            const amountToCredit = realAmount.times(1e8);
            console.log('transferLog');
            console.log(txHash);
            console.log('sender:', sender.value);
            console.log('recipient:', recipient.value);
            console.log('amount:', amountToCredit.toString());
            console.log(memo);

            console.log('transaction not found');
            const address = await db.address.findOne({
              where: {
                address: process.env.SECRET_ADDRESS,
                memo: memo || 'missing memo',
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
                    {
                      model: db.user,
                      as: 'user',
                    },
                  ],
                },
              ],
            });
            const findCoin = await db.coin.findOne({
              where: {
                ticker: 'SCRT',
              },
            });
            if (!address) {
              if (findCoin) {
                const unknownTransaction = await db.transaction.findOrCreate({
                  where: {
                    txid: txHash,
                    type: 'receive',
                    coinId: findCoin.id,
                  },
                  defaults: {
                    txid: txHash,
                    phase: 'failed',
                    type: 'receive',
                    confirmations: 1,
                    amount: amountToCredit.toString(),
                    coinId: findCoin.id,
                    memo: memo || 'missing memo',
                  },
                });
              }
            }
            if (address) {
              if (findCoin) {
                const newTransaction = await db.transaction.findOrCreate({
                  where: {
                    txid: txHash,
                    type: 'receive',
                    userId: address.wallet.userId,
                    walletId: address.wallet.id,
                  },
                  defaults: {
                    txid: txHash,
                    addressId: address.id,
                    phase: 'confirming',
                    type: 'receive',
                    confirmations: 1,
                    amount: amountToCredit.toString(),
                    userId: address.wallet.userId,
                    walletId: address.wallet.id,
                    coinId: findCoin.id,
                    memo,
                  },
                });

                if (newTransaction[1]) {
                  const transaction = await db.transaction.findOne({
                    where: {
                      id: newTransaction[0].id,
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
                  const newActivity = await db.activity.findOrCreate({
                    where: {
                      transactionId: newTransaction[0].id,
                    },
                    defaults: {
                      earnerId: address.wallet.userId,
                      type: 'depositComplete',
                      amount: amountToCredit.toString(),
                      transactionId: newTransaction[0].id,
                    },
                  });
                  const activity = [];
                  activity.unshift(newActivity[0]);
                  if (transaction) {
                    io.to(transaction.userId).emit(
                      'insertTransaction',
                      {
                        result: transaction,
                      },
                    );
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.log(e);
  }
};
