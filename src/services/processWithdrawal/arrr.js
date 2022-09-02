import { config } from "dotenv";
import {
  getPirateInstance,
} from "../rclient";
import { fromUtf8ToHex } from "../../helpers/utils";

config();

export const withdrawARRR = async (
  transaction,
  amount,
) => {
  let response;
  let responseStatus;

  try {
    const hexMemo = await fromUtf8ToHex(transaction.memo);
    const preResponse = await getPirateInstance().zSendMany(
      process.env.PIRATE_CONSOLIDATION_ADDRESS,
      [{
        address: transaction.to_from,
        amount: amount.toFixed(8).toString(),
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

  return [
    response,
    responseStatus,
  ];
};
