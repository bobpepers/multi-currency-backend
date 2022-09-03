import StellarSdk from 'stellar-sdk';
import { config } from "dotenv";
import {
  getRunebaseInstance,
  getPirateInstance,
  getTokelInstance,
} from '../../../services/rclient';

config();

const server = new StellarSdk.Server('https://horizon.stellar.org');
const keypair = StellarSdk.Keypair.fromSecret(process.env.STELLAR_SECRET);

export const getBalance = async () => {
  let runebaseResponse;
  let pirateResponse;
  let tokelResponse;
  let lumensResponse;
  let runesBalance;
  let arrrBalance;
  let tklBalance;
  let xlmBalance;
  let dxlmBalance;

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

  return [
    runesBalance,
    arrrBalance,
    tklBalance,
    xlmBalance,
    dxlmBalance,
  ];
};
