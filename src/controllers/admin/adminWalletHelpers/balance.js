import StellarSdk from 'stellar-sdk';
import BigNumber from 'bignumber.js';
import { config } from "dotenv";
import {
  getRunebaseInstance,
  getPirateInstance,
  getTokelInstance,
  getSecretjsInstance,
} from '../../../services/rclient';

config();

const server = new StellarSdk.Server('https://horizon.stellar.org');
const keypair = StellarSdk.Keypair.fromSecret(process.env.STELLAR_SECRET);

export const getBalance = async () => {
  let runebaseResponse;
  let pirateResponse;
  let tokelResponse;
  let lumensResponse;
  let secretResponse;
  let runesBalance;
  let arrrBalance;
  let tklBalance;
  let xlmBalance;
  let dxlmBalance;
  let scrtBalance;

  try {
    runebaseResponse = await getRunebaseInstance().getWalletInfo();
  } catch (e) {
    console.log(e);
  }
  try {
    pirateResponse = await getPirateInstance().zGetBalances();
  } catch (e) {
    console.log(e);
  }
  try {
    tokelResponse = await getTokelInstance().getWalletInfo();
  } catch (e) {
    console.log(e);
  }
  try {
    lumensResponse = await server.loadAccount(keypair.publicKey());
  } catch (e) {
    console.log(e);
  }

  if (runebaseResponse) {
    runesBalance = runebaseResponse.balance;
  }
  if (pirateResponse) {
    arrrBalance = pirateResponse.reduce((n, { balance }) => n + balance, 0);
  }
  if (tokelResponse) {
    tklBalance = tokelResponse.balance;
  }
  if (lumensResponse) {
    xlmBalance = Number.parseFloat(lumensResponse.balances.find((b) => b.asset_type === 'native').balance);
    dxlmBalance = Number.parseFloat(lumensResponse.balances.find((b) => b.asset_code === 'DXLM').balance);
  }
  try {
    const secretjs = await getSecretjsInstance();
    console.log(secretjs.wallet.address);
    const secretResponse = await secretjs.query.bank.balance({
      address: secretjs.wallet.address,
      denom: "uscrt",
    });

    scrtBalance = new BigNumber(secretResponse.balance.amount).dividedBy(1e6).toString();
  } catch (e) {
    console.log(e);
  }

  return [
    runesBalance,
    arrrBalance,
    tklBalance,
    xlmBalance,
    dxlmBalance,
    scrtBalance,
  ];
};
