// import { Transaction } from 'sequelize';
import db from '../../models';

export const fetchAllCoins = async (
  req,
  res,
  next,
) => {
  const options = {
    attributes: {
      exclude: [
        'createdAt',
        'updatedAt',
      ],
    },
    include: [
      {
        model: db.withdrawalSetting,
        as: 'withdrawalSetting',
        attributes: {
          exclude: [
            'userId',
            'id',
            'coinId',
            'createdAt',
            'updatedAt',
          ],
        },
      },
    ],
  };
  res.locals.name = 'coins';
  res.locals.result = await db.coin.findAll(options);
  if (!res.locals.result) {
    throw new Error("NOT_FOUND");
  }
  next();
};
