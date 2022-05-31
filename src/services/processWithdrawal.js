import { Transaction } from "sequelize";
import {
  Server,
  Keypair,
  Asset,
  Operation,
  TransactionBuilder,
  Networks,
  Memo,
} from 'stellar-sdk';
import { config } from "dotenv";
import {
  getRunebaseInstance,
  getTokelInstance,
  getPirateInstance,
} from "./rclient";
import { fromUtf8ToHex } from "../helpers/utils";

config();

const server = new Server('https://horizon.stellar.org');
const sourceKeypair = Keypair.fromSecret(process.env.STELLAR_SECRET);
const sourcePublicKey = sourceKeypair.publicKey();

export const processWithdrawal = async (
  transaction,
  io,
  t,
) => {
  let response;
  let responseStatus;
  let updatedWallet;
  const amount = ((transaction.amount - Number(transaction.feeAmount)) / 1e8);

  if (transaction.wallet.coin.ticker === 'RUNES') {
    try {
      response = await getRunebaseInstance().sendToAddress(transaction.to_from, (amount.toFixed(8)).toString());
    } catch (e) {
      console.log(e);
      responseStatus = e.reponse.status;
    }
  } else if (transaction.wallet.coin.ticker === 'TKL') {
    try {
      response = await getTokelInstance().sendToAddress(transaction.to_from, (amount.toFixed(8)).toString());
    } catch (e) {
      console.log(e);
      responseStatus = e.reponse.status;
    }
  } else if (transaction.wallet.coin.ticker === 'ARRR') {
    try {
      const hexMemo = await fromUtf8ToHex(transaction.memo);
      const preResponse = await getPirateInstance().zSendMany(
        process.env.PIRATE_CONSOLIDATION_ADDRESS,
        [{
          address: transaction.to_from,
          amount: amount.toFixed(8),
          ...(
            hexMemo && {
              memo: hexMemo,
            }
          ),
        }],
        1,
        0.0001,
      );
      let opStatus = await getPirateInstance().zGetOperationStatus([preResponse]);
      while (!opStatus || opStatus[0].status === 'executing') {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // eslint-disable-next-line no-await-in-loop
        opStatus = await getPirateInstance().zGetOperationStatus([preResponse]);
      }
      response = opStatus[0].result.txid;
    } catch (e) {
      console.log(e);
      responseStatus = e.response.status;
    }
  } else if (transaction.wallet.coin.ticker === 'XLM') {
    let transactionResult;
    try {
      const txOptions = {
        fee: await server.fetchBaseFee(),
        networkPassphrase: Networks.PUBLIC,
      };
      console.log(txOptions);
      const account = await server.loadAccount(sourcePublicKey);
      const stellarTransaction = new TransactionBuilder(account, txOptions)
        .addOperation(Operation.payment({
          destination: transaction.to_from,
          asset: Asset.native(),
          amount: (amount.toFixed(7)),
        }))
        .setTimeout(30)
        .addMemo(Memo.text(transaction.memo))
        .build();
      stellarTransaction.sign(sourceKeypair);
      response = await server.submitTransaction(stellarTransaction);
      // console.log(JSON.stringify(response, null, 2));
      console.log('\nSuccess! View the transaction at: ');
      console.log(response._links.transaction.href);
    } catch (e) {
      console.log(e.response.status);
      responseStatus = e.response.status;
    }
    if (response) {
      updatedWallet = await transaction.wallet.update({
        locked: transaction.wallet.locked - transaction.amount,
      }, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
    }
  }

  return [
    response,
    responseStatus,
    updatedWallet,
  ];
};
