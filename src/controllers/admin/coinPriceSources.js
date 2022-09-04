import db from '../../models';

export const updateCoinPriceSource = async (
  req,
  res,
  next,
) => {
  if (!req.body.id) {
    throw new Error("coin is required");
  }
  if (!req.body.coinId) {
    throw new Error("priceSource is required");
  }
  if (!req.body.priceSourceId) {
    throw new Error("priceSource is required");
  }
  if (!req.body.coinPriceSourceId) {
    throw new Error("coinPriceSourceId is required");
  }
  if (!req.body.enabled) {
    throw new Error("enabled is required");
  }
  const coinPriceSource = await db.CoinPriceSource.findOne({
    where: {
      id: req.body.id,
    },
  });
  const updatedCoinPriceSource = await coinPriceSource.update({
    coinPriceSourceId: req.body.coinPriceSourceId,
    enabled: req.body.enabled === 'enabled',
  });
  res.locals.name = 'updateCoinPriceSource';
  res.locals.result = await db.CoinPriceSource.findOne({
    where: {
      id: updatedCoinPriceSource.id,
    },
    include: [
      {
        model: db.coin,
        as: 'coin',
      },
      {
        model: db.priceSource,
        as: 'priceSource',
      },
    ],
  });
  next();
};

export const removeCoinPriceSource = async (
  req,
  res,
  next,
) => {
  const coinPriceSource = await db.CoinPriceSource.findOne({
    where: {
      id: req.body.id,
    },
  });
  res.locals.name = 'removeCoinPriceSource';
  res.locals.result = coinPriceSource;
  coinPriceSource.destroy();
  next();
};

export const addCoinPriceSource = async (
  req,
  res,
  next,
) => {
  console.log(req.body);
  if (!req.body.coin) {
    throw new Error("coin is required");
  }
  if (!req.body.priceSource) {
    throw new Error("priceSource is required");
  }
  if (!req.body.coinPriceSourceId) {
    throw new Error("coinPriceSourceId is required");
  }
  if (!req.body.enabled) {
    throw new Error("enabled is required");
  }

  const coinPriceSource = await db.CoinPriceSource.findOne({
    where: {
      coinId: req.body.coin,
      priceSourceId: req.body.priceSource,
    },
  });

  if (coinPriceSource) {
    throw new Error("Already Exists");
  }

  const createCoinPriceSource = await db.CoinPriceSource.create({
    coinId: req.body.coin,
    priceSourceId: req.body.priceSource,
    coinPriceSourceId: req.body.coinPriceSourceId,
    enabled: req.body.enabled === 'enabled',
  });

  res.locals.name = 'addCoinPriceSource';
  res.locals.result = await db.CoinPriceSource.findOne({
    where: {
      id: createCoinPriceSource.id,
    },
    include: [
      {
        model: db.coin,
        as: 'coin',
      },
      {
        model: db.priceSource,
        as: 'priceSource',
      },
    ],
  });

  next();
};
