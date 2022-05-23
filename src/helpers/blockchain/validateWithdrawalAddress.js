import {
  getRunebaseInstance,
  getPirateInstance,
  getTokelInstance,
} from '../../services/rclient';

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
  }

  if (!getAddressInfo) {
    isInvalidAddress = true;
  }

  return [
    isInvalidAddress,
    isNodeOffline,
  ];
};
