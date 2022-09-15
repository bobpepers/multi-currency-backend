import passport from 'passport';
import {
  signin,
  signup,
  verifyEmail,
  resendVerification,
  destroySession,
  isUserBanned,
} from '../controllers/auth';

import {
  disabletfa,
  enabletfa,
  ensuretfa,
  unlocktfa,
  istfa,
} from '../controllers/tfa';

import { isAdmin } from '../controllers/admin/admin';
import { fetchUserInfo } from '../controllers/admin/userInfo';
import { fetchAdminWallet } from '../controllers/admin/wallet';

import {
  fetchAdminWithdrawalSettings,
  updateAdminWithdrawalSetting,
} from '../controllers/admin/withdrawalSettings';

import { healthCheck } from '../controllers/health';
import {
  insertIp,
  isIpBanned,
} from '../controllers/ip';
import { fetchErrors } from '../controllers/admin/errors';
import { fetchNodeStatus } from '../controllers/admin/status';
import { fetchUserActivity } from '../controllers/user/activity';
import { fetchAdminActivity } from '../controllers/admin/activity';
import { addNewWithdrawalAddress } from '../controllers/user/newWithdrawalAddress';
import { removeWithdrawalAddress } from '../controllers/user/removeWithdrawalAddress';
import { createWalletsForUser } from '../controllers/user/wallet';
import { verifyMyCaptcha } from '../controllers/recaptcha';
import { fetchTransactions } from '../controllers/user/transactions';
import { fetchUser } from '../controllers/user/user';
import { verifyNewWithdrawalAddress } from '../controllers/user/verifyNewWithdrawalAddress';
import { resendWithdrawalAddressVerification } from '../controllers/user/resendWithdrawalAddressVerification';
import { createWithdrawal } from '../controllers/user/createWithdrawal';
import { fetchCoinInfo } from '../controllers/user/coin';
import { fetchAllCoins } from '../controllers/user/coins';
import { fetchAllPriceSources } from '../controllers/user/priceSource';

import {
  fetchWithdrawalAddress,
  fetchWithdrawalAddresses,
} from '../controllers/admin/withdrawalAddresses';

import {
  addPriceCurrency,
  removePriceCurrency,
  updatePriceCurrency,
  updatePriceCurrencyPrices,
} from '../controllers/admin/currencies';

import {
  addCoinPriceSource,
  removeCoinPriceSource,
  updateCoinPriceSource,
} from '../controllers/admin/coinPriceSources';

import {
  fetchCoinPriceSources,
} from '../controllers/user/coinPriceSources';

import {
  fetchCurrencies,
} from '../controllers/user/currencies';

import {
  resetPassword,
  verifyResetPassword,
  resetPasswordNew,
} from '../controllers/resetPassword';

import {
  fetchDeposits,
  patchDeposits,
} from '../controllers/admin/deposits';

// import {
//   fetchBlockNumber,
// } from '../controllers/blockNumber';

// import {
//   startSyncBlocks,
// } from '../controllers/sync';

import {
  fetchUsers,
  banUser,
} from '../controllers/admin/users';

import passportService from '../services/passport';
import { fetchWithdrawals } from '../controllers/admin/withdrawals';

const requireSignin = passport.authenticate('local', {
  session: true,
  failWithError: true,
  keepSessionInfo: true,
});

const IsAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    console.log('isauthenticated passed');
    next();
  } else {
    console.log('isAuthenticated not passed');
    res.status(401).send({
      error: 'Unauthorized',
    });
  }
};

const use = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const respondCountAndResult = (req, res) => {
  if (
    res.locals.count
    && res.locals.result
    && res.locals.result.length > 0
  ) {
    res.json({
      count: res.locals.count,
      result: res.locals.result,
    });
  } else if (
    res.locals.result.length < 1
  ) {
    res.status(404).send({
      error: `No ${res.locals.name} records found`,
    });
  } else {
    res.status(401).send({
      error: "ERROR",
    });
  }
};

const respondResult = (req, res) => {
  if (
    res.locals.result
    && res.locals.result.length > 0
  ) {
    res.json({
      result: res.locals.result,
    });
  } else if (
    typeof res.locals.result === 'object'
    && Object.keys(res.locals.result).length > 0
    && res.locals.result !== null
  ) {
    res.json({
      result: res.locals.result,
    });
  } else if (
    res.locals.result.length < 1
  ) {
    res.status(404).send({
      error: `No ${res.locals.name} records found`,
    });
  } else {
    res.status(401).send({
      error: "ERROR",
    });
  }
};

export const apiRouter = (
  app,
  io,
  sockets,
  queue,
) => {
  const attachResIoClient = (req, res, next) => {
    res.locals.io = io;
    next();
  };

  const attachQueue = (req, res, next) => {
    res.locals.queue = queue;
    next();
  };

  app.get(
    '/api/health',
    use(healthCheck),
    respondResult,
  );

  app.get(
    '/api/authenticated',
    (req, res, next) => {
      if (req.isAuthenticated()) {
        next();
      } else {
        res.json({
          result: {
            tfaLocked: false,
            success: false,
          },
        });
      }
    },
    istfa,
  );

  app.post(
    '/api/signup',
    use(verifyMyCaptcha),
    use(insertIp),
    use(isIpBanned),
    signup,
  );

  app.post(
    '/api/currencies',
    use(IsAuthenticated),
    use(isAdmin),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(fetchCurrencies),
    respondCountAndResult,
  );

  app.post(
    '/api/admin/management/currencies/remove',
    use(IsAuthenticated),
    use(isAdmin),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(removePriceCurrency),
    respondResult,
  );

  app.post(
    '/api/admin/management/currencies/update',
    use(IsAuthenticated),
    use(isAdmin),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(updatePriceCurrency),
    respondResult,
  );

  app.post(
    '/api/admin/management/currencies/add',
    use(IsAuthenticated),
    use(isAdmin),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(addPriceCurrency),
    respondResult,
  );

  app.post(
    '/api/admin/management/currencies/updateprice',
    use(IsAuthenticated),
    use(isAdmin),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(updatePriceCurrencyPrices),
    respondResult,
  );

  app.post(
    '/api/admin/management/coinpricesource/add',
    use(IsAuthenticated),
    use(isAdmin),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(addCoinPriceSource),
    respondResult,
  );

  app.post(
    '/api/admin/management/coinpricesource/remove',
    use(IsAuthenticated),
    use(isAdmin),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(removeCoinPriceSource),
    respondResult,
  );

  app.post(
    '/api/admin/management/coinpricesource/update',
    use(IsAuthenticated),
    use(isAdmin),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(updateCoinPriceSource),
    respondResult,
  );

  app.get(
    '/api/coinpricesources',
    use(IsAuthenticated),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(fetchCoinPriceSources),
    respondCountAndResult,
  );

  // app.get(
  //   '/api/sync/blocks',
  //   IsAuthenticated,
  //   isAdmin,
  //   isUserBanned,
  //   use(insertIp),
  //   ensuretfa,
  //   use(startSyncBlocks),
  //   respondResult,
  // );

  // app.get(
  //   '/api/blocknumber',
  //   IsAuthenticated,
  //   isAdmin,
  //   isUserBanned,
  //   use(insertIp),
  //   ensuretfa,
  //   use(fetchBlockNumber),
  //   respondResult,
  // );

  app.post(
    '/api/activity',
    use(IsAuthenticated),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(fetchUserActivity),
    respondCountAndResult,
  );

  app.post(
    '/api/admin/activity',
    use(IsAuthenticated),
    use(isAdmin),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(fetchAdminActivity),
    respondCountAndResult,
  );

  // app.post(
  //   '/api/deposits/patch',
  //   IsAuthenticated,
  //   isAdmin,
  //   isUserBanned,
  //   use(insertIp),
  //   ensuretfa,
  //   use(patchDeposits),
  //   respondResult,
  // );

  app.get(
    '/api/coin/:ticker',
    use(fetchCoinInfo),
    use(insertIp),
    use(isIpBanned),
    respondResult,
  );

  app.get(
    '/api/coins',
    use(fetchAllCoins),
    use(insertIp),
    use(isIpBanned),
    respondResult,
  );

  app.get(
    '/api/pricesources',
    use(fetchAllPriceSources),
    use(insertIp),
    use(isIpBanned),
    respondResult,
  );

  app.post(
    '/api/user',
    use(IsAuthenticated),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(fetchUser),
    respondResult,
  );

  app.post(
    '/api/withdraw/address/add',
    use(IsAuthenticated),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(addNewWithdrawalAddress),
    respondResult,
  );

  app.post(
    '/api/withdraw/address/remove',
    use(IsAuthenticated),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(removeWithdrawalAddress),
    respondResult,
  );

  app.post(
    '/api/withdraw/address/verify/resend',
    use(IsAuthenticated),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(resendWithdrawalAddressVerification),
    respondResult,
  );

  app.post(
    '/api/withdraw/create',
    use(IsAuthenticated),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(attachResIoClient),
    use(createWithdrawal),
    respondResult,
  );
  app.post(
    '/api/withdraw/address/verify',
    use(insertIp),
    use(isIpBanned),
    use(attachResIoClient),
    use(verifyNewWithdrawalAddress),
    respondResult,
  );

  app.post(
    '/api/admin/management/users',
    use(IsAuthenticated),
    use(isAdmin),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(fetchUsers),
    respondCountAndResult,
  );

  app.post(
    '/api/admin/management/user/ban',
    use(IsAuthenticated),
    use(isAdmin),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(banUser),
    respondResult,
  );

  app.post(
    '/api/admin/withdrawals',
    use(IsAuthenticated),
    use(isAdmin),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(fetchWithdrawals),
    respondCountAndResult,
  );

  app.post(
    '/api/admin/deposits',
    use(IsAuthenticated),
    use(isAdmin),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(fetchDeposits),
    respondCountAndResult,
  );

  app.post(
    '/api/transactions',
    use(IsAuthenticated),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(fetchTransactions),
    respondCountAndResult,
  );

  app.post(
    '/api/admin/errors',
    use(IsAuthenticated),
    use(isAdmin),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(fetchErrors),
    respondCountAndResult,
  );

  app.post(
    '/api/management/withdrawaladdresses',
    use(IsAuthenticated),
    use(isAdmin),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(fetchWithdrawalAddresses),
    respondCountAndResult,
  );

  app.post(
    '/api/management/withdrawaladdress',
    use(IsAuthenticated),
    use(isAdmin),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(fetchWithdrawalAddress),
    respondResult,
  );

  app.post(
    '/api/management/userinfo',
    use(IsAuthenticated),
    use(isAdmin),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(fetchUserInfo),
    respondResult,
  );

  app.get(
    '/api/status',
    use(IsAuthenticated),
    use(isAdmin),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(fetchNodeStatus),
    respondResult,
  );

  app.get(
    '/api/admin/withdrawal/settings',
    use(IsAuthenticated),
    use(isAdmin),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(fetchAdminWithdrawalSettings),
    respondResult,
  );

  app.post(
    '/api/admin/withdrawal/setting/update',
    use(IsAuthenticated),
    use(isAdmin),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(updateAdminWithdrawalSetting),
    respondResult,
  );

  app.get(
    '/api/admin/wallet',
    use(IsAuthenticated),
    use(isAdmin),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    use(fetchAdminWallet),
    respondResult,
  );

  app.post(
    '/api/signup/verify-email',
    use(insertIp),
    use(isIpBanned),
    use(verifyEmail),
    (req, res) => {
      console.log(res.locals.error);
      if (res.locals.error === 'AUTH_TOKEN_EXPIRED') {
        res.status(401).send({
          error: {
            message: res.locals.error,
            resend: true,
          },
        });
      }
      if (res.locals.error) {
        res.status(401).send({
          error: {
            message: res.locals.error,
            resend: false,
          },
        });
      }
      if (res.locals.user) {
        res.json({
          firstname: res.locals.user.firstname,
          username: res.locals.user.username,
        });
      }
    },
  );

  app.post(
    '/api/resend-verify-code',
    // IsAuthenticated,
    use(insertIp),
    use(isIpBanned),
    // rateLimiterMiddlewarePhone,
    // ensuretfa,
    // updateLastSeen,
    use(resendVerification),
  );

  app.post(
    '/api/signin',
    use(insertIp),
    use(isIpBanned),
    use(verifyMyCaptcha),
    requireSignin,
    use(isUserBanned),
    use(signin),
    use(createWalletsForUser),
    respondResult,
  );

  app.post(
    '/api/reset-password',
    use(insertIp),
    use(isIpBanned),
    use(verifyMyCaptcha),
    use(resetPassword),
    respondResult,
  );

  app.post(
    '/api/reset-password/verify',
    use(insertIp),
    use(isIpBanned),
    use(verifyResetPassword),
    respondResult,
  );

  app.post(
    '/api/reset-password/new',
    use(insertIp),
    use(isIpBanned),
    use(resetPasswordNew),
    respondResult,
  );

  app.post(
    '/api/2fa/enable',
    use(IsAuthenticated),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    ensuretfa,
    // updateLastSeen,
    use(enabletfa),
    respondResult,
  );

  app.post(
    '/api/2fa/disable',
    use(IsAuthenticated),
    use(insertIp),
    use(isIpBanned),
    use(ensuretfa),
    // updateLastSeen,
    use(disabletfa),
    respondResult,
  );

  app.post(
    '/api/2fa/unlock',
    use(IsAuthenticated),
    use(isUserBanned),
    use(insertIp),
    use(isIpBanned),
    use(unlocktfa),
    respondResult,
  );

  app.get(
    '/api/logout',
    use(insertIp),
    use(isIpBanned),
    use(destroySession),
  );
};
