import WebSocket from 'ws';
import axios from 'axios';
import { Transaction } from "sequelize";
import BigNumber from "bignumber.js";
import { getSecretjsInstance } from '../../../services/rclient';
import db from '../../../models';
import { startSecretSync } from '../../../services/syncSecret';
// import logger from "../../logger";

/**
 * Patch Transaction From Secret
 */
const walletNotifySecret = async (
  io,
  queue,
) => {
  const ws = new WebSocket(process.env.SECRET_WS_URL);
  const secretjs = await getSecretjsInstance();

  ws.onopen = function (e) {
    console.log("[open] Connection established");

    // consume all events for the compute module
    const newBlockQuery = `tm.event='NewBlock'`;
    const newDepositQuery = `tm.event='Tx' AND transfer.recipient='${process.env.SECRET_ADDRESS}'`;

    ws.send(
      JSON.stringify({
        jsonrpc: "2.0",
        method: "subscribe",
        params: {
          query: newBlockQuery,
        },
        id: "newBlock", // jsonrpc id
      }),
    );

    ws.send(
      JSON.stringify({
        jsonrpc: "2.0",
        method: "subscribe",
        params: {
          query: newDepositQuery,
        },
        id: "newDeposit", // jsonrpc id
      }),
    );
  };

  ws.onmessage = async function (event) {
    const myData = JSON.parse(event.data);
    if (myData.id === 'newBlock') {
      if (myData.result.data) {
        const {
          height,
        } = myData.result.data.value.block.header;
        if (Number(height) % 5 === 0) {
          startSecretSync(
            io,
            queue,
            height,
          );
        }
      }
    }
    if (myData.id === 'newDeposit') {
      if (
        myData.result.data
        && myData.result.data.value
      ) {
        // secret1zxpzyv2zd3nk4aqnquvdm7e9swc8a2m4sc6sdu
        const log = JSON.parse(myData.result.data.value.TxResult.result.log);
        const transfer = log[0].events.find((x) => x.type === 'transfer');
        const recipient = transfer.attributes.find((x) => x.key === 'recipient');
        const sender = transfer.attributes.find((x) => x.key === 'sender');
        const amount = transfer.attributes.find((x) => x.key === 'amount');
        const txHash = myData.result.events['tx.hash'][0];
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

            console.log('realAmount:', realAmount.toString());
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
      console.log('newDeposit');
    }
    // console.log(myData.id);
  };

  ws.onclose = function (event) {
    if (event.wasClean) {
      console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
    } else {
      // e.g. server process killed or network down
      // event.code is usually 1006 in this case
      console.log('Implement ws reconnection here?');
      console.log('[close] Connection died');
    }
  };

  ws.onerror = function (error) {
    console.log(`Log the websocket error to database here`);
    console.log(`[error] ${error.message}`);
  };
};

export default walletNotifySecret;
