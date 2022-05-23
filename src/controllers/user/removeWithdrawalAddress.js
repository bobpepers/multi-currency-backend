// import { Transaction } from 'sequelize';
import db from '../../models';

export const removeWithdrawalAddress = async (
  req,
  res,
  next,
) => {
  const walletAddressExternal = await db.WalletAddressExternal.findOne({
    where: {
      id: req.body.id,
      enabled: true,
    },
    include: [
      {
        model: db.wallet,
        as: 'wallet',
        where: {
          userId: req.user.id,
        },
      },
    ],
  });
  if (!walletAddressExternal) {
    throw new Error("Withdrawal address not found");
  }
  if (walletAddressExternal && !walletAddressExternal.enabled) {
    throw new Error("Withdrawal address already removed");
  }
  await walletAddressExternal.update({
    enabled: false,
  });

  res.locals.name = 'removeWalletAddressExternal';
  res.locals.result = { id: walletAddressExternal.id };
  next();
};
