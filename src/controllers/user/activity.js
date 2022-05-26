import { Op, Sequelize } from 'sequelize';
import db from '../../models';

export const fetchActivity = async (
  req,
  res,
  next,
) => {
  // const spenderOptions = {};
  // const earnerOptions = {};

  const activityOptions = {
    ...(
      req.body.amount !== '' && {
        amount: Number((Number(req.body.amount) * 1e8).toFixed(0)),
      }
    ),
    ...(
      req.body.type !== '' && {
        type: { [Op.like]: `%${req.body.type}%` },
      }
    ),
    ...(
      req.body.id !== '' && {
        [Op.or]: [
          Sequelize.where(Sequelize.cast(Sequelize.col('activity.id'), 'CHAR'), 'LIKE', `%${req.body.id}%`),
        ],
      }
    ),
    ...(
      (req.body.earner !== '' || req.body.spender !== '') && {
        [Op.or]: [
          { '$earner.user_id$': { [Op.like]: `%${req.body.earner !== '' ? req.body.earner : null}%` } },
          { '$earner.username$': { [Op.like]: `%${req.body.earner !== '' ? req.body.earner : null}%` } },
          { '$spender.user_id$': { [Op.like]: `%${req.body.spender !== '' ? req.body.spender : null}%` } },
          { '$spender.username$': { [Op.like]: `%${req.body.spender !== '' ? req.body.spender : null}%` } },
        ],
      }
    ),
  };

  const options = {
    where: activityOptions,
    order: [
      ['id', 'DESC'],
    ],
    limit: req.body.limit,
    offset: req.body.offset,
    include: [
      {
        model: db.user,
        as: 'spender',
        // where: spenderOptions,
        required: false,
      },
      {
        model: db.user,
        as: 'earner',
        // where: earnerOptions,
        required: false,
      },
    ],
  };

  res.locals.name = 'activities';
  res.locals.count = await db.activity.count(options);
  res.locals.result = await db.activity.findAll(options);
  next();
};
