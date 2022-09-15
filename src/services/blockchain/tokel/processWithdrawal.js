import { config } from "dotenv";
import {
  getTokelInstance,
} from "../../rclient";

config();

export const withdrawTKL = async (
  transaction,
  amount,
) => {
  let response;
  let responseStatus;

  try {
    response = await getTokelInstance().sendToAddress(transaction.to_from, amount.toFixed(8).toString());
  } catch (e) {
    console.log(e);
    responseStatus = e.reponse.status;
  }

  return [
    response,
    responseStatus,
  ];
};
