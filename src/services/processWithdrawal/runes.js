import {
  getRunebaseInstance,
} from "../rclient";

export const withdrawRUNES = async (
  transaction,
  amount,
) => {
  let response;
  let responseStatus;

  try {
    response = await getRunebaseInstance().sendToAddress(transaction.to_from, (amount.toFixed(8)).toString());
  } catch (e) {
    console.log(e);
    responseStatus = e.reponse.status;
  }

  return [
    response,
    responseStatus,
  ];
};
