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
  const runebase = await db.coin.findOne({
    where: {
      name: 'runebase',
      ticker: `RUNES`,
    },
  });
  if (!runebase) {
    await db.coin.create({
      name: 'runebase',
      ticker: `RUNES`,
    });
  }

  // Create Pirate Coin
  const pirate = await db.coin.findOne({
    where: {
      name: 'pirate',
      ticker: `ARRR`,
    },
  });
  if (!pirate) {
    await db.coin.create({
      name: 'pirate',
      ticker: `ARRR`,
    });
  }

  // Create Tokel Coin
  const tokel = await db.coin.findOne({
    where: {
      name: 'tokel',
      ticker: `TKL`,
    },
  });
  if (!tokel) {
    await db.coin.create({
      name: 'tokel',
      ticker: `TKL`,
    });
  }

};
