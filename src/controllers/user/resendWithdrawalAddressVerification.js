import db from '../../models';
import { generateVerificationToken } from '../../helpers/generate';
import { sendVerifyAddressEmail } from '../../helpers/email';

export const resendWithdrawalAddressVerification = async (
  req,
  res,
  next,
) => {
  const {
    walletId,
    walletAddressExternalId,
  } = req.body;
  const findWalletAddressExternal = await db.WalletAddressExternal.findOne({
    where: {
      id: walletAddressExternalId,
      walletId,
      enabled: true,
    },
    include: [
      {
        model: db.addressExternal,
        as: 'addressExternal',
      },
      {
        model: db.wallet,
        as: 'wallet',
        where: {
          userId: req.user.id,
        },
        include: [
          {
            model: db.user,
            as: 'user',
          },
          {
            model: db.coin,
            as: 'coin',
          },
        ],
      },
    ],
  });
  if (!findWalletAddressExternal) {
    throw new Error("Withdrawal Address not found");
  }
  const verificationToken = await generateVerificationToken(24);

  const updatedWalletAddressExternal = await findWalletAddressExternal.update({
    token: verificationToken.token,
    tokenExpires: verificationToken.expires,
    confirmed: false,
    enabled: true,
    addressExternalId: findWalletAddressExternal.addressExternal.id,
    walletId: findWalletAddressExternal.wallet.id,
  });

  sendVerifyAddressEmail(
    findWalletAddressExternal.wallet.user.email,
    findWalletAddressExternal.wallet.user.username,
    verificationToken.token,
    findWalletAddressExternal.wallet.coin.name,
    findWalletAddressExternal.wallet.coin.ticker,
    findWalletAddressExternal.addressExternal.address,
  );

  res.locals.name = 'resendWalletAddressExternal';
  res.locals.result = await db.WalletAddressExternal.findOne({
    where: {
      id: updatedWalletAddressExternal.id,
    },
    attributes: [
      'id',
      'walletId',
      'confirmed',
      'tokenExpires',
    ],
    include: [
      {
        model: db.addressExternal,
        as: 'addressExternal',
        attributes: [
          'address',
        ],
      },
    ],
  });
  next();
};
