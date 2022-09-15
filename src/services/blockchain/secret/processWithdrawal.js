import { config } from "dotenv";
import BigNumber from "bignumber.js";
import {
  getSecretjsInstance,
} from "../../rclient";

config();

export const withdrawSCRT = async (
  transaction,
  amount,
) => {
  let response;
  let responseStatus;
  let balance;
  let secretjs;

  try {
    secretjs = await getSecretjsInstance();
    const bankBalance = await secretjs.query.bank.balance({
      address: secretjs.wallet.address,
      denom: "uscrt",
    });
    balance = bankBalance.balance.amount;
  } catch (e) {
    console.log(e);
    responseStatus = 'NO_CONNECTION';
    return [
      response,
      responseStatus,
    ];
  }

  try {
    if (balance) {
      const checkBalanceAmount = new BigNumber(balance).dividedBy(1e6).times(1e8);
      const uscrtAmount = new BigNumber(amount.toFixed(6)).times(1e6);
      console.log(checkBalanceAmount.toString());
      console.log(uscrtAmount.toString());
      console.log('balance checking here');
      if (checkBalanceAmount.isGreaterThan(uscrtAmount)) {
        const preResponse = await secretjs.tx.bank.send(
          {
            amount: [
              {
                // amount: amount.toFixed(6),
                amount: uscrtAmount.toString(),
                denom: "uscrt",
              },
            ],
            fromAddress: secretjs.wallet.address,
            toAddress: transaction.to_from,
          },
          {
            gasLimit: 20000,
            gasPriceInFeeDenom: 0.25,
            memo: "",
          },
        );
        console.log(preResponse);
        console.log(preResponse.tx.body);
        response = preResponse.transactionHash;
      }
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
