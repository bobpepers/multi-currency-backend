import { Op } from 'sequelize';
import db from '../../models';

export const banUser = async (
  req,
  res,
  next,
) => {
  const user = await db.user.findOne({
    where: {
      id: req.body.id,
    },
    include: [
      {
        model: db.wallet,
        as: 'wallet',
      },
    ],
  });
  res.locals.name = 'banUser';
  res.locals.result = await user.update({
    banned: !user.banned,
    banMessage: req.body.banMessage,
  });
  next();
};

export const fetchUsers = async (req, res, next) => {
  const userWhereOptions = {};
  if (req.body.id !== '') {
    userWhereOptions.id = { [Op.like]: `%${Number(req.body.id)}%` };
  }
  if (req.body.userId !== '') {
    userWhereOptions.user_id = { [Op.like]: `%${req.body.userId}%` };
  }
  if (req.body.username !== '') {
    userWhereOptions.username = { [Op.like]: `%${req.body.username}%` };
  }
  if (req.body.banned !== 'all') {
    if (req.body.banned === 'true') {
      userWhereOptions.banned = true;
    }
    if (req.body.banned === 'false') {
      userWhereOptions.banned = false;
    }
  }

  const options = {
    order: [
      [
        'id',
        'DESC',
      ],
    ],
    attributes: {
      exclude: [
        'authexpires',
        'authtoken',
        'authused',
        'password',
        'resetpasstoken',
        'tfa_secret',
      ],
    },
    limit: req.body.limit,
    offset: req.body.offset,
    where: userWhereOptions,
    include: [
      {
        model: db.wallet,
        as: 'wallets',
        attributes: {
          exclude: [
            'userId',
          ],
        },
        include: [
          {
            model: db.coin,
            as: 'coin',
            attributes: {
              exclude: [
                'createdAt',
                'updatedAt',
              ],
            },
          },
        ],
      },
    ],
  };

  res.locals.name = 'users';
  res.locals.result = await db.user.findAll(options);
  options.distinct = true;
  res.locals.count = await db.user.count(options);

  next();
};
