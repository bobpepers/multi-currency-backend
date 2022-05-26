import { Transaction } from 'sequelize';
import db from '../models';

export const fetchUser = async (
  req,
  res,
  next,
) => {
  res.locals.name = 'fetchUser';
  res.locals.result = await db.user.findOne({
    where: {
      id: req.user.id,
    },
    include: [
      {
        model: db.wallet,
        as: 'wallets',
        required: false,
        attributes: [
          'id',
          'available',
          'locked',
          'spend',
          'earned',
        ],
        include: [
          {
            model: db.address,
            as: 'address',
            required: false,
            attributes: [
              'address',
            ],
          },
          {
            model: db.coin,
            as: 'coin',
            required: true,
            attributes: [
              'name',
              'ticker',
            ],
            include: [
              {
                model: db.withdrawalSetting,
                as: 'withdrawalSetting',
              },
            ],
          },
          {
            model: db.WalletAddressExternal,
            as: 'WalletAddressExternals',
            required: false,
            where: {
              enabled: true,
            },
            attributes: [
              'id',
              'confirmed',
              'tokenExpires',
            ],
            include: [
              {
                model: db.addressExternal,
                as: 'addressExternal',
                required: false,
                attributes: [
                  'address',
                ],
              },
            ],
          },
        ],
      },
    ],
    attributes: {
      exclude: [
        'password',
        'id',
        'authtoken',
        'authused',
        'authexpires',
        'resetpasstoken',
        'resetpassused',
        'resetpassexpires',
        'updatedAt',
      ],
    },
  });
  console.log('fetch user');
  next();
};

export const updateLastSeen = async (
  req,
  res,
  next,
) => {
  await db.sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  }, async (t) => {
    const user = await db.user.findOne(
      {
        where: {
          id: req.user.id,
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      },
    );
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }
    const updatedUser = await user.update(
      {
        lastSeen: new Date(Date.now()),
      },
      {
        transaction: t,
        lock: t.LOCK.UPDATE,
      },
    );

    t.afterCommit(() => {
      next();
    });
  }).catch((err) => {
    console.log(err.message);
    res.locals.error = err.message;
    next();
  });
};
