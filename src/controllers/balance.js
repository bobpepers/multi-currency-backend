import {
  getRunebaseInstance,
  getPirateInstance,
} from '../services/rclient';

export const fetchBalance = async (
  req,
  res,
  next,
) => {
  res.locals.name = 'balance';
  const runebaseResponse = await getRunebaseInstance().getWalletInfo();
  const pirateResponse = await getPirateInstance().zGetBalances();

  res.locals.result = {
    runebase: runebaseResponse.balance,
    pirate: pirateResponse.reduce((n, { balance }) => n + balance, 0),
  };
  next();
};
