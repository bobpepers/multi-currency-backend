import {
  Sequelize,
  Op,
} from 'sequelize';
import db from '../../models';

export const fetchAdminFaucetBalance = async (
  req,
  res,
  next,
) => {
  const faucetRunebase = await db.faucet.findOne({
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
  const faucetPirate = await db.faucet.findOne({
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
  const faucetTokel = await db.faucet.findOne({
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
  const faucetLumens = await db.faucet.findOne({
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
  const faucetDogeLumens = await db.faucet.findOne({
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

  res.locals.name = "liability";
  res.locals.result = {
    runebase: faucetRunebase.amount,
    pirate: faucetPirate.amount,
    tokel: faucetTokel.amount,
    lumens: faucetLumens.amount,
    dogeLumens: faucetDogeLumens.amount,
  };

  next();
};
