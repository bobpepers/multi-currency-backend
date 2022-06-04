// import { Transaction } from 'sequelize';
import db from '../../models';
import timingSafeEqual from '../../helpers/timingSafeEqual';

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
    include: [
      {
        model: db.withdrawalSetting,
        as: 'withdrawalSetting',
      },
    ],
  };

  res.locals.name = 'coinInfo';
  res.locals.result = await db.coin.findOne(options);
  next();
};
