// import { Transaction } from 'sequelize';
import db from '../../models';
import timingSafeEqual from '../../helpers/timingSafeEqual';

export const verifyNewWithdrawalAddress = async (
  req,
  res,
  next,
) => {
  const {
    email,
    address,
    token,
  } = req.body;
  const WalletAddressExternal = await db.WalletAddressExternal.findOne({
    include: [
      {
        model: db.addressExternal,
        as: 'addressExternal',
        required: true,
        where: {
          address,
        },
      },
      {
        model: db.wallet,
        as: 'wallet',
        required: true,
        include: [
          {
            model: db.user,
            as: 'user',
            required: true,
            where: {
              email,
            },
          },
        ],
      },
    ],
  });
  if (!WalletAddressExternal) {
    throw new Error('WITHDRAWAL_ADDRESS_NOT_FOUND');
  }
  if (WalletAddressExternal.confirmed === true) {
    throw new Error('TOKEN_ALREADY_USED');
  }
  if (new Date() > WalletAddressExternal.tokenExpires) {
    throw new Error('TOKEN_EXPIRED');
  }
  if (!timingSafeEqual(token, WalletAddressExternal.token)) {
    throw new Error('INCORRECT_TOKEN');
  }

  const updatedWalletAddressExternal = await WalletAddressExternal.update({
    confirmed: true,
  });

  res.locals.io.to(req.user.id).emit(
    'confirmNewWithdrawalAddress',
    {
      result: {
        id: updatedWalletAddressExternal.id,
        walletId: updatedWalletAddressExternal.walletId,
      },
    },
  );

  res.locals.name = 'confirmWalletAddressExternal';
  res.locals.result = { id: true };
  next();
};
