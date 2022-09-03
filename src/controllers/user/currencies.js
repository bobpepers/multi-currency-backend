import db from '../../models';

export const fetchCurrencies = async (
  req,
  res,
  next,
) => {
  const options = {
    order: [
      ['id', 'ASC'],
    ],
  };
  res.locals.name = 'currencies';
  res.locals.count = await db.currency.count(options);
  res.locals.result = await db.currency.findAll(options);
  next();
};
