import { config } from "dotenv";
import {
  getRunebaseInstance,
  getTokelInstance,
  getPirateInstance,
} from "./rclient";
import { fromUtf8ToHex } from "../helpers/utils";

config();

export const processWithdrawal = async (transaction) => {
  let response;
  let responseStatus;
  const amount = ((transaction.amount - Number(transaction.feeAmount)) / 1e8);
  console.log(transaction.wallet);
  // Add New Currency here (default fallback is Runebase)
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
  }

  return [
    response,
    responseStatus,
  ];
};
