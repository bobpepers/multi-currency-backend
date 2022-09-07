import { getFaucets } from './adminWalletHelpers/faucet';
import { getLiability } from './adminWalletHelpers/liability';
import { getBalance } from './adminWalletHelpers/balance';

export const fetchAdminWallet = async (
  req,
  res,
  next,
) => {
  const [
    runesFaucetBalance,
    arrrFaucetBalance,
    tklFaucetBalance,
    xlmFaucetBalance,
    dxlmFaucetBalance,
    scrtFaucetBalance,
  ] = await getFaucets();

  const [
    runesLiability,
    arrrLiability,
    tklLiability,
    xlmLiability,
    dxlmLiability,
    scrtLiability,
  ] = await getLiability();

  const [
    runesBalance,
    arrrBalance,
    tklBalance,
    xlmBalance,
    dxlmBalance,
    scrtBalance,
  ] = await getBalance();

  res.locals.name = "adminWallet";
  res.locals.result = [
    {
      name: 'Runebase',
      ticker: 'RUNES',
      faucetBalance: runesFaucetBalance,
      liability: runesLiability,
      balance: runesBalance,
    },
    {
      name: 'Pirate',
      ticker: 'ARRR',
      faucetBalance: arrrFaucetBalance,
      liability: arrrLiability,
      balance: arrrBalance,
    },
    {
      name: 'Tokel',
      ticker: 'TKL',
      faucetBalance: tklFaucetBalance,
      liability: tklLiability,
      balance: tklBalance,
    },
    {
      name: 'Stellar Lumens',
      ticker: 'XLM',
      faucetBalance: xlmFaucetBalance,
      liability: xlmLiability,
      balance: xlmBalance,
    },
    {
      name: 'Doge Lumens',
      ticker: 'DXLM',
      faucetBalance: dxlmFaucetBalance,
      liability: dxlmLiability,
      balance: dxlmBalance,
    },
    {
      name: 'Secret Network',
      ticker: 'SCRT',
      faucetBalance: scrtFaucetBalance,
      liability: scrtLiability,
      balance: scrtBalance,
    },
  ];
  console.log(res.locals.result);

  next();
};
