import { config } from "dotenv";
import BigNumber from "bignumber.js";
import {
  getRunebaseInstance,
} from "../rclient";

config();

export const withdrawRUNES = async (
  transaction,
  amount,
) => {
  let response;
  let responseStatus;

  try {
    const listUnspent = await getRunebaseInstance().listUnspent();
    const foundConsolidationRunebaseAddress = listUnspent.find((obj) => obj.address === process.env.RUNEBASE_CONSOLIDATION_ADDRESS);
    const consolidationAddressAmount = new BigNumber(foundConsolidationRunebaseAddress.amount);
    if (
      foundConsolidationRunebaseAddress
      && amount.plus(0.005).isLessThan(consolidationAddressAmount)
    ) {
      const inputs = [
        {
          txid: foundConsolidationRunebaseAddress.txid,
          vout: foundConsolidationRunebaseAddress.vout,
        },
      ];
      const outputs = [
        {
          [transaction.to_from]: (amount.toFixed(8)).toString(),
        },
        {
          [process.env.RUNEBASE_CONSOLIDATION_ADDRESS]: consolidationAddressAmount.minus(amount).minus(0.005).toFixed(8).toString(),
        },
      ];
      const rawTransaction = await getRunebaseInstance().createRawTransaction(
        inputs,
        outputs,
      );
      const signedTransaction = await getRunebaseInstance().signRawTransactionWithWallet(rawTransaction);
      response = await getRunebaseInstance().sendRawTransaction(signedTransaction.hex);
    }
  } catch (e) {
    console.log(e);
    responseStatus = e.reponse.status;
  }

  return [
    response,
    responseStatus,
  ];
};
