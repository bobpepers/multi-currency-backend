// import { Transaction } from 'sequelize';
import db from '../../models';

export const fetchCoinInfo = async (
  req,
  res,
  next,
) => {
  const {
    ticker,
  } = req.params;
  const options = {
    where: {
      ticker,
    },
    attributes: {
      exclude: [
        'id',
        'createdAt',
      ],
    },
    include: [
      {
        model: db.withdrawalSetting,
        as: 'withdrawalSetting',
        attributes: {
          exclude: [
            'createdAt',
            'id',
            'coinId',
          ],
        },
      },
      {
        model: db.CoinPriceSource,
        as: 'CoinPriceSources',
        attributes: {
          exclude: [
            'createdAt',
            'coinId',
            'enabled',
            'id',
          ],
        },
        include: [
          {
            model: db.priceSource,
            as: 'priceSource',
            attributes: {
              exclude: [
                'createdAt',
                'id',
              ],
            },
          },
        ],
      },
    ],
  };
  res.locals.name = 'coinInfo';
  res.locals.result = await db.coin.findOne(options);
  if (!res.locals.result) {
    throw new Error("NOT_FOUND");
  }
  next();
};
