import { Transaction } from 'sequelize';
import BigNumber from "bignumber.js";
import db from '../../models';
import logger from "../../helpers/logger";

export const createWithdrawal = async (
  req,
  res,
  next,
) => {
  const {
    walletId,
    walletAddressExternalId,
    memo = '',
  } = req.body;
  if (!walletId) {
    throw new Error('WALLET_ID_NOT_FOUND');
  }
  if (!walletAddressExternalId) {
    throw new Error('WALLETADDRESSEXTERNAL_ID_NOT_FOUND');
  }
  console.log(memo);
  console.log(req.body);
  console.log('memo');
  if (!memo && memo !== '') {
    throw new Error('MEMO_NOT_FOUND');
  }

  const activity = [];
  await db.sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  }, async (t) => {
    // DO BIGNUMBER VALUE CHECKING WITH .isGreaterThan .isSmallerThan in amount validations (safer) (TEMP DISABLE FRONTEND VALIDATION FOR TESTING)
    const amount = new BigNumber(req.body.amount).times(1e8);
    const walletAddressExternal = await db.WalletAddressExternal.findOne({
      where: {
        walletId,
        id: walletAddressExternalId,
      },
      include: [
        {
          model: db.wallet,
          as: 'wallet',
          where: {
            userId: req.user.id,
          },
          include: [
            {
              model: db.coin,
              as: 'coin',
            },
          ],
        },
        {
          model: db.addressExternal,
          as: 'addressExternal',
        },
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!walletAddressExternal) {
      throw new Error("Wallet not found");
    }
    const withdrawalSetting = await db.withdrawalSetting.findOne({
      where: {
        coinId: walletAddressExternal.wallet.coinId,
      },
    });
    if (!withdrawalSetting) {
      throw new Error('FEE_SETTINGS_NOT_FOUND');
    }
    if (!withdrawalSetting.enabled) {
      throw new Error(`${walletAddressExternal.wallet.coin.ticker}_WITHDRAWAL_DISABLED`);
    }
    if (amount < new BigNumber(withdrawalSetting.min)) { // smaller then 5 RUNES
      const realWithdrawMin = new BigNumber(withdrawalSetting.min).dividedBy(1e8).toString();
      throw new Error(`MINIMUM_WITHDRAW_${realWithdrawMin}_RUNES`);
    }
    if (amount % 1 !== 0) {
      throw new Error('MAX_8_DECIMALS');
    }
    if (amount > new BigNumber(walletAddressExternal.wallet.available)) {
      throw new Error('NOT_ENOUGH_FUNDS');
    }
    if (String(memo).length > 512) {
      throw new Error('MEMO_MAX_512_CHARACTERS');
    }

    const wallet = await walletAddressExternal.wallet.update({
      available: new BigNumber(walletAddressExternal.wallet.available).minus(amount).toString(),
      locked: new BigNumber(walletAddressExternal.wallet.locked).plus(amount).toString(),
    }, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    const feeAmount = amount.dividedBy(100).times(
      new BigNumber(withdrawalSetting.fee).dividedBy(1e2),
    ).toFixed(0);

    const createTransaction = await db.transaction.create({
      walletId: wallet.id,
      coinId: wallet.coinId,
      addressExternalId: walletAddressExternal.addressExternal.id,
      phase: 'review',
      type: 'send',
      to_from: walletAddressExternal.addressExternal.address,
      amount: amount.toString(),
      feeAmount,
      userId: walletAddressExternal.wallet.userId,
      memo,
    }, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    const transaction = await db.transaction.findOne({
      where: {
        id: createTransaction.id,
      },
      include: [
        {
          model: db.user,
          as: 'user',
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
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    res.locals.result = {
      wallet,
      transaction,
    };

    t.afterCommit(() => {
      res.locals.io.to(req.user.id).emit(
        'insertTransaction',
        {
          result: res.locals.result.transaction,
        },
      );
      res.locals.io.to(req.user.id).emit(
        'updateWallet',
        {
          result: res.locals.result.wallet,
        },
      );
    });
  }).catch(async (err) => {
    try {
      await db.error.create({
        type: 'withdraw',
        error: `${err}`,
      });
    } catch (e) {
      logger.error(`Withdrawal Error: ${e}`);
    }
    throw new Error(err);
  });
  if (activity.length > 0) {
    res.locals.io.to('admin').emit('updateActivity', {
      result: activity,
    });
    res.locals.io.to(req.user.id).emit(
      'updateActivity',
      {
        result: activity,
      },
    );
  }

  next();
};
