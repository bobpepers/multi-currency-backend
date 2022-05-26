import db from '../models';

export const initDatabaseRecords = async (
  discordClient,
  telegramClient,
  matrixClient,
) => {
  // ADD USD RECORD PRICEINFO
  const createUSDCurrencytRecord = await db.currency.findOrCreate({
    where: {
      id: 1,
    },
    defaults: {
      id: 1,
      currency_name: "USD",
      iso: 'USD',
      type: 'FIAT',
    },
  });

  // Create Runebase Coin
  let runebase = await db.coin.findOne({
    where: {
      name: 'runebase',
      ticker: `RUNES`,
    },
  });
  if (!runebase) {
    runebase = await db.coin.create({
      name: 'runebase',
      ticker: `RUNES`,
    });
  }

  // Create Pirate Coin
  let pirate = await db.coin.findOne({
    where: {
      name: 'pirate',
      ticker: `ARRR`,
    },
  });
  if (!pirate) {
    pirate = await db.coin.create({
      name: 'pirate',
      ticker: `ARRR`,
    });
  }

  // Create Tokel Coin
  let tokel = await db.coin.findOne({
    where: {
      name: 'tokel',
      ticker: `TKL`,
    },
  });
  if (!tokel) {
    tokel = await db.coin.create({
      name: 'tokel',
      ticker: `TKL`,
    });
  }

  let runebaseFee = await db.withdrawalSetting.findOne({
    where: {
      coinId: runebase.id,
    },
  });
  if (!runebaseFee) {
    runebaseFee = await db.withdrawalSetting.create({
      coinId: runebase.id,
    });
  }

  let pirateFee = await db.withdrawalSetting.findOne({
    where: {
      coinId: pirate.id,
    },
  });
  if (!pirateFee) {
    pirateFee = await db.withdrawalSetting.create({
      coinId: pirate.id,
    });
  }

  let tokelFee = await db.withdrawalSetting.findOne({
    where: {
      coinId: tokel.id,
    },
  });
  if (!tokelFee) {
    tokelFee = await db.withdrawalSetting.create({
      coinId: tokel.id,
    });
  }
};
