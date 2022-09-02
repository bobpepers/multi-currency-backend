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

config();

const server = new Server('https://horizon.stellar.org');
const sourceKeypair = Keypair.fromSecret(process.env.STELLAR_SECRET);
const sourcePublicKey = sourceKeypair.publicKey();

export const withdrawDXLM = async (
  transaction,
  amount,
) => {
  let response;
  let responseStatus;

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
        asset: new Asset('DXLM', 'GAE6DWVMZDAOBU4IIPGDM2EJ65PWZQ5X7MI7PUURWKTEVZSEJHRYI247'),
        amount: (amount.toFixed(7).toString()),
      }))
      .setTimeout(30)
      .addMemo(Memo.text(transaction.memo))
      .build();
    stellarTransaction.sign(sourceKeypair);
    response = await server.submitTransaction(stellarTransaction);
    console.log('\nSuccess! View the transaction at: ');
    console.log(response._links.transaction.href);
  } catch (e) {
    console.log(e);
    console.log(e.response.status);
    responseStatus = e.response.status;
  }

  return [
    response,
    responseStatus,
  ];
};
