import db from '../../models';

export const fetchCoinPriceSources = async (
  req,
  res,
  next,
) => {
  const options = {
    order: [
      [
        'id',
        'ASC',
      ],
    ],
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
  };
  res.locals.name = 'coinPriceSources';
  res.locals.count = await db.CoinPriceSource.count(options);
  res.locals.result = await db.CoinPriceSource.findAll(options);
  next();
};
