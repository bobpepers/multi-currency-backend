import StellarSdk from 'stellar-sdk';
import {
  getRunebaseInstance,
  getPirateInstance,
  getTokelInstance,
  getSecretjsInstance,
} from '../rclient';

const server = new StellarSdk.Server('https://horizon.stellar.org');

export const validateWithdrawalAddress = async (
  ticker,
  address,
) => {
  let failWithdrawalActivity;
  let getAddressInfo;
  let isInvalidAddress = false;
  let isNodeOffline = false;

  if (ticker === 'RUNES') {
    try {
      getAddressInfo = await getRunebaseInstance().validateAddress(address);
      console.log(getAddressInfo);
      if (getAddressInfo && !getAddressInfo.isvalid) {
        isInvalidAddress = true;
      }
      if (getAddressInfo && getAddressInfo.isvalid) {
        isInvalidAddress = false;
      }
    } catch (e) {
      isNodeOffline = true;
    }
  } else if (ticker === 'ARRR') {
    try {
      getAddressInfo = await getPirateInstance().zValidateAddress(address);
      if (getAddressInfo && !getAddressInfo.isvalid) {
        isInvalidAddress = true;
      }
      if (getAddressInfo && getAddressInfo.isvalid) {
        isInvalidAddress = false;
      }
    } catch (e) {
      isNodeOffline = true;
    }
  } else if (ticker === 'TKL') {
    try {
      getAddressInfo = await getTokelInstance().validateAddress(address);
      console.log(getAddressInfo);
      if (getAddressInfo && !getAddressInfo.isvalid) {
        isInvalidAddress = true;
      }
      if (getAddressInfo && getAddressInfo.isvalid) {
        isInvalidAddress = false;
      }
    } catch (e) {
      isNodeOffline = true;
    }
  } else if (ticker === 'SCRT') {
    try {
      const secretjs = await getSecretjsInstance();
      getAddressInfo = await secretjs.query.auth.account({
        address,
      });
      isInvalidAddress = true;
      if (getAddressInfo && getAddressInfo.type === 'BaseAccount') {
        isInvalidAddress = false;
      }
    } catch (e) {
      console.log(e);
      isNodeOffline = true;
    }
  } else if (ticker === 'XLM') {
    console.log('XLM TICKER');
    try {
      getAddressInfo = StellarSdk.StrKey.isValidEd25519PublicKey(address);
    } catch (e) {
      isNodeOffline = true;
    }
  } else if (ticker === 'DXLM') {
    console.log('DXLM TICKER');
    let hasTrustLine;
    let isValidPubKey;
    let account;
    try {
      isValidPubKey = StellarSdk.StrKey.isValidEd25519PublicKey(address);
    } catch (e) {
      isNodeOffline = true;
    }
    try {
      account = await server.accounts().accountId(address).call();
    } catch (e) {
      isNodeOffline = true;
    }
    if (account) {
      hasTrustLine = account.balances.find((balance, i) => (
        balance.asset_code === 'DXLM'
        && balance.asset_issuer === 'GAE6DWVMZDAOBU4IIPGDM2EJ65PWZQ5X7MI7PUURWKTEVZSEJHRYI247'
      ));
    }
    if (!hasTrustLine) {
      throw new Error(`Address has no DXLM trust-line`);
    }
    if (isValidPubKey && hasTrustLine) {
      getAddressInfo = true;
    }
  }

  if (!getAddressInfo) {
    isInvalidAddress = true;
  }

  return [
    isInvalidAddress,
    isNodeOffline,
  ];
};
