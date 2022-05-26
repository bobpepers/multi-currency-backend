// import { parseDomain } from "parse-domain";
// import { Op } from 'sequelize';
import db from '../models';

export const fetchTransactions = async (
  req,
  res,
  next,
) => {
  const transactionOptions = {
    userId: req.user.id,
  };

  const options = {
    where: transactionOptions,
    limit: req.body.limit,
    offset: req.body.offset,
    order: [
      ['id', 'DESC'],
    ],
    include: [
      {
        model: db.address,
        as: 'address',
      },
      {
        model: db.wallet,
        as: 'wallet',
        include: [
          {
            model: db.coin,
            as: 'coin',
          },
        ],
      },
    ],
  };

  res.locals.name = 'transactions';
  res.locals.count = await db.transaction.count(options);
  res.locals.result = await db.transaction.findAll(options);
  next();
};
