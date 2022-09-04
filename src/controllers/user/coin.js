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
    include: [
      {
        model: db.withdrawalSetting,
        as: 'withdrawalSetting',
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
