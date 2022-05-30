import {
  Server,
  Account,
  Keypair,
  Asset,
  Operation,
  TransactionBuilder,
  Networks,
} from 'stellar-sdk';
import { config } from "dotenv";

config();

const trustDogeLumensStellarToken = async () => {
  const keypair = Keypair.fromSecret(process.env.STELLAR_SECRET);
  const server = new Server("https://horizon.stellar.org/");
  const txOptions = {
    fee: await server.fetchBaseFee(),
    networkPassphrase: Networks.PUBLIC,
  };

  await server
    .accounts()
    .accountId(keypair.publicKey())
    .call()
    .then(({ sequence }) => {
      const account = new Account(keypair.publicKey(), sequence);
      console.log(account);
      const transaction = new TransactionBuilder(account, txOptions)
        .addOperation(
          Operation.changeTrust({
            asset: new Asset('DXLM', 'GAE6DWVMZDAOBU4IIPGDM2EJ65PWZQ5X7MI7PUURWKTEVZSEJHRYI247'),
          }),
        )
        .setTimeout(0)
        .build();

      transaction.sign(keypair);
      server.submitTransaction(transaction)
        .then(
          (res) => {
            console.log('Success! Token Trusted.');
          },
          (err) => { throw err; },
        );
    });
};

trustDogeLumensStellarToken();
