// import { Transaction } from 'sequelize';
import db from '../../models';
import {
  validateWithdrawalAddress,
} from '../../helpers/blockchain/validateWithdrawalAddress';
import { generateVerificationToken } from '../../helpers/generate';
import { sendVerifyAddressEmail } from '../../helpers/email';

export const addNewWithdrawalAddress = async (
  req,
  res,
  next,
) => {
  console.log(req.body);
  const wallet = await db.wallet.findOne({
    where: {
      id: req.body.walletId,
      userId: req.user.id,
    },
    include: [
      {
        model: db.coin,
        as: 'coin',
      },
    ],
  });
  if (!wallet) {
    throw new Error("Wallet not found");
  }
  const findAllWalletAddressExternals = await db.WalletAddressExternal.findAll({
    where: {
      walletId: wallet.id,
      enabled: true,
    },
  });
  if (findAllWalletAddressExternals.length >= 5) {
    throw new Error("Maximum 5 withdrawal addresses");
  }
  let addressExternal = await db.addressExternal.findOne({
    where: {
      address: req.body.address,
      coinId: wallet.coin.id,
    },
  });
  if (!addressExternal) {
    const [
      isInvalidAddress,
      isNodeOffline,
    ] = await validateWithdrawalAddress(
      wallet.coin.ticker,
      req.body.address,
    );
    if (isNodeOffline) {
      throw new Error(`${wallet.coin.name} node is offline`);
    }
    if (isInvalidAddress) {
      throw new Error(`${wallet.coin.name} address is invalid`);
    }

    addressExternal = await db.addressExternal.create({
      address: req.body.address,
      coinId: wallet.coin.id,
    });
  }
  let walletAddressExternal = await db.WalletAddressExternal.findOne({
    where: {
      walletId: wallet.id,
      addressExternalId: addressExternal.id,
    },
  });
  if (walletAddressExternal && walletAddressExternal.enabled) {
    throw new Error("You already added this address");
  }

  const verificationToken = await generateVerificationToken(24);

  let addWalletAddressExternal;
  if (walletAddressExternal && !walletAddressExternal.enabled) {
    walletAddressExternal = await walletAddressExternal.update({
      token: verificationToken.token,
      tokenExpires: verificationToken.expires,
      confirmed: false,
      enabled: true,
      addressExternalId: addressExternal.id,
      walletId: wallet.id,
    });
  }
  if (!walletAddressExternal) {
    walletAddressExternal = await db.WalletAddressExternal.create({
      token: verificationToken.token,
      tokenExpires: verificationToken.expires,
      confirmed: false,
      enabled: true,
      addressExternalId: addressExternal.id,
      walletId: wallet.id,
    });
  }

  res.locals.name = 'addWalletAddressExternal';
  res.locals.result = await db.WalletAddressExternal.findOne({
    where: {
      id: walletAddressExternal.id,
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
  // res.locals.sockets[req.user.id.toString()].emit('insertNewWithdrawalAddress', { result: res.locals.result });
  next();
};
