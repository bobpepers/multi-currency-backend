import db from '../../models';

export const fetchErrors = async (
  req,
  res,
  next,
) => {
  const userOptions = {};

  const options = {
    order: [
      ['id', 'DESC'],
    ],
    limit: req.body.limit,
    offset: req.body.offset,
    where: userOptions,
  };

  res.locals.name = 'error';
  res.locals.count = await db.error.count(options);
  res.locals.result = await db.error.findAll(options);
  next();
};
