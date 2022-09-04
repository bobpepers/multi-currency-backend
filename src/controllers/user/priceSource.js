// import { Transaction } from 'sequelize';
import db from '../../models';

export const fetchAllPriceSources = async (
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
  };
  res.locals.name = 'priceSources';
  res.locals.result = await db.priceSource.findAll(options);
  if (!res.locals.result) {
    throw new Error("NOT_FOUND");
  }
  next();
};
