import db from '../../../models';

export const getFaucets = async () => {
  const runesFaucetBalance = await db.faucet.findOne({
    include: [
      {
        model: db.coin,
        as: 'coin',
        required: true,
        attributes: [],
        where: {
          ticker: 'RUNES',
        },
      },
    ],
  });
  const arrrFaucetBalance = await db.faucet.findOne({
    include: [
      {
        model: db.coin,
        as: 'coin',
        required: true,
        attributes: [],
        where: {
          ticker: 'ARRR',
        },
      },
    ],
  });
  const tklFaucetBalance = await db.faucet.findOne({
    include: [
      {
        model: db.coin,
        as: 'coin',
        required: true,
        attributes: [],
        where: {
          ticker: 'TKL',
        },
      },
    ],
  });
  const xlmFaucetBalance = await db.faucet.findOne({
    include: [
      {
        model: db.coin,
        as: 'coin',
        required: true,
        attributes: [],
        where: {
          ticker: 'XLM',
        },
      },
    ],
  });
  const dxlmFaucetBalance = await db.faucet.findOne({
    include: [
      {
        model: db.coin,
        as: 'coin',
        required: true,
        attributes: [],
        where: {
          ticker: 'DXLM',
        },
      },
    ],
  });

  const scrtFaucetBalance = await db.faucet.findOne({
    include: [
      {
        model: db.coin,
        as: 'coin',
        required: true,
        attributes: [],
        where: {
          ticker: 'SCRT',
        },
      },
    ],
  });

  return [
    runesFaucetBalance,
    arrrFaucetBalance,
    tklFaucetBalance,
    xlmFaucetBalance,
    dxlmFaucetBalance,
    scrtFaucetBalance,
  ];
};
