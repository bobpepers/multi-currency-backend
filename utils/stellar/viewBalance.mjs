import { config } from "dotenv";

import StellarSdk from 'stellar-sdk';

config();

const server = new StellarSdk.Server('https://horizon.stellar.org'); // const server = new StellarSdk.Server('https://horizon.stellar.org');

// Note: this solution trusts the accounts asset codes alone.
// For general accounts you may need to verify the issuing account id: b.asset_issuer
const getBalance = (account, currency) => {
  let balance = 0;
  if (currency === 'XLM') {
    balance = Number.parseFloat(account.balances.find((b) => b.asset_type === 'native').balance);
  } else {
    balance = Number.parseFloat(account.balances.find((b) => b.asset_code === currency).balance);
  }
  return balance;
};

const keypair = StellarSdk.Keypair.fromSecret(process.env.STELLAR_SECRET);

server.loadAccount(keypair.publicKey())
  .then((account) => {
    console.log(account.balances);
    // console.log(getBalance(account, 'XPORT'));
  });
