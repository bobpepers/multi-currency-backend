import StellarSdk from 'stellar-sdk';
import { config } from "dotenv";
import {
  getRunebaseInstance,
  getPirateInstance,
  getTokelInstance,
} from '../../services/rclient';

config();

const server = new StellarSdk.Server('https://horizon.stellar.org');
const keypair = StellarSdk.Keypair.fromSecret(process.env.STELLAR_SECRET);

export const fetchAdminBalance = async (
  req,
  res,
  next,
) => {
  res.locals.name = 'balance';
  let runebaseResponse;
  let pirateResponse;
  let tokelResponse;
  let lumensResponse;
  let runebaseBalance;
  let pirateBalance;
  let tokelBalance;
  let lumensBalance;
  let dogeLumensBalance;

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
    runebaseBalance = runebaseResponse.balance;
  }
  if (pirateResponse) {
    pirateBalance = pirateResponse.reduce((n, { balance }) => n + balance, 0);
  }
  if (tokelResponse) {
    tokelBalance = tokelResponse.balance;
  }
  if (lumensResponse) {
    lumensBalance = Number.parseFloat(lumensResponse.balances.find((b) => b.asset_type === 'native').balance);
    dogeLumensBalance = Number.parseFloat(lumensResponse.balances.find((b) => b.asset_code === 'DXLM').balance);
  }

  res.locals.result = {
    runebase: runebaseBalance,
    pirate: pirateBalance,
    tokel: tokelBalance,
    lumens: lumensBalance,
    dogeLumens: dogeLumensBalance,
  };
  next();
};
