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
import { fetchAdminLiability } from '../controllers/admin/liability';
import { fetchAdminBalance } from '../controllers/admin/balance';
import { fetchAdminFaucetBalance } from '../controllers/admin/faucetBalance';

import { healthCheck } from '../controllers/health';
import { insertIp } from '../controllers/ip';
import { fetchErrors } from '../controllers/admin/errors';
import { fetchNodeStatus } from '../controllers/admin/status';
import { fetchActivity } from '../controllers/user/activity';
import { addNewWithdrawalAddress } from '../controllers/user/newWithdrawalAddress';
import { removeWithdrawalAddress } from '../controllers/user/removeWithdrawalAddress';
import { createWalletsForUser } from '../controllers/user/wallet';
import { verifyMyCaptcha } from '../controllers/recaptcha';
import { fetchTransactions } from '../controllers/user/transactions';
import { fetchUser } from '../controllers/user/user';
import { verifyNewWithdrawalAddress } from '../controllers/user/verifyNewWithdrawalAddress';
import { resendWithdrawalAddressVerification } from '../controllers/user/resendWithdrawalAddressVerification';
import { createWithdrawal } from '../controllers/user/createWithdrawal';

import {
  fetchWithdrawalAddress,
  fetchWithdrawalAddresses,
} from '../controllers/admin/withdrawalAddresses';

// import {
//   fetchPriceCurrencies,
//   addPriceCurrency,
//   removePriceCurrency,
//   updatePriceCurrency,
//   updatePriceCurrencyPrices,
// } from '../controllers/priceCurrencies';

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

// import {
//   fetchUsers,
//   banUser,
// } from './controllers/users';

import passportService from '../services/passport';
import { fetchWithdrawals } from '../controllers/admin/withdrawals';

const requireSignin = passport.authenticate('local', {
  session: true,
  failWithError: true,
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
    verifyMyCaptcha,
    use(insertIp),
    signup,
  );

  // app.post(
  //   '/api/management/user/ban',
  //   IsAuthenticated,
  //   isAdmin,
  //   isUserBanned,
  //   use(insertIp),
  //   ensuretfa,
  //   use(banUser),
  //   respondResult,
  // );

  // app.post(
  //   '/api/management/pricecurrencies',
  //   IsAuthenticated,
  //   isAdmin,
  //   isUserBanned,
  //   use(insertIp),
  //   ensuretfa,
  //   use(fetchPriceCurrencies),
  //   respondCountAndResult,
  // );

  // app.post(
  //   '/api/management/pricecurrencies/remove',
  //   IsAuthenticated,
  //   isAdmin,
  //   isUserBanned,
  //   use(insertIp),
  //   ensuretfa,
  //   use(removePriceCurrency),
  //   respondResult,
  // );

  // app.post(
  //   '/api/management/pricecurrencies/update',
  //   IsAuthenticated,
  //   isAdmin,
  //   isUserBanned,
  //   use(insertIp),
  //   ensuretfa,
  //   use(updatePriceCurrency),
  //   respondResult,
  // );

  // app.post(
  //   '/api/management/pricecurrencies/add',
  //   IsAuthenticated,
  //   isAdmin,
  //   isUserBanned,
  //   use(insertIp),
  //   ensuretfa,
  //   use(addPriceCurrency),
  //   respondResult,
  // );

  // app.post(
  //   '/api/management/pricecurrencies/updateprice',
  //   IsAuthenticated,
  //   isAdmin,
  //   isUserBanned,
  //   use(insertIp),
  //   ensuretfa,
  //   use(updatePriceCurrencyPrices),
  //   respondResult,
  // );

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
    IsAuthenticated,
    isAdmin,
    isUserBanned,
    use(insertIp),
    ensuretfa,
    use(fetchActivity),
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

  app.post(
    '/api/user',
    IsAuthenticated,
    isUserBanned,
    use(insertIp),
    ensuretfa,
    use(fetchUser),
    respondResult,
  );

  app.post(
    '/api/withdraw/address/add',
    IsAuthenticated,
    isUserBanned,
    use(insertIp),
    ensuretfa,
    use(addNewWithdrawalAddress),
    respondResult,
  );

  app.post(
    '/api/withdraw/address/remove',
    IsAuthenticated,
    isUserBanned,
    use(insertIp),
    ensuretfa,
    use(removeWithdrawalAddress),
    respondResult,
  );

  app.post(
    '/api/withdraw/address/verify/resend',
    IsAuthenticated,
    isUserBanned,
    use(insertIp),
    ensuretfa,
    use(resendWithdrawalAddressVerification),
    respondResult,
  );

  app.post(
    '/api/withdraw/create',
    IsAuthenticated,
    isUserBanned,
    use(insertIp),
    ensuretfa,
    use(attachResIoClient),
    use(createWithdrawal),
    respondResult,
  );
  app.post(
    '/api/withdraw/address/verify',
    use(attachResIoClient),
    use(verifyNewWithdrawalAddress),
    respondResult,
  );

  // app.post(
  //   '/api/management/users',
  //   IsAuthenticated,
  //   isAdmin,
  //   isUserBanned,
  //   use(insertIp),
  //   ensuretfa,
  //   use(fetchUsers),
  //   respondCountAndResult,
  // );

  app.post(
    '/api/admin/withdrawals',
    IsAuthenticated,
    isAdmin,
    isUserBanned,
    use(insertIp),
    ensuretfa,
    use(fetchWithdrawals),
    respondCountAndResult,
  );

  app.post(
    '/api/admin/deposits',
    IsAuthenticated,
    isAdmin,
    isUserBanned,
    use(insertIp),
    ensuretfa,
    use(fetchDeposits),
    respondCountAndResult,
  );

  app.post(
    '/api/transactions',
    IsAuthenticated,
    isUserBanned,
    use(insertIp),
    ensuretfa,
    use(fetchTransactions),
    respondCountAndResult,
  );

  app.post(
    '/api/admin/errors',
    IsAuthenticated,
    isAdmin,
    isUserBanned,
    use(insertIp),
    ensuretfa,
    use(fetchErrors),
    respondCountAndResult,
  );

  app.post(
    '/api/management/withdrawaladdresses',
    IsAuthenticated,
    isAdmin,
    isUserBanned,
    use(insertIp),
    ensuretfa,
    use(fetchWithdrawalAddresses),
    respondCountAndResult,
  );

  app.post(
    '/api/management/withdrawaladdress',
    IsAuthenticated,
    isAdmin,
    isUserBanned,
    use(insertIp),
    ensuretfa,
    use(fetchWithdrawalAddress),
    respondResult,
  );

  app.post(
    '/api/management/userinfo',
    IsAuthenticated,
    isAdmin,
    isUserBanned,
    use(insertIp),
    ensuretfa,
    use(fetchUserInfo),
    respondResult,
  );

  app.get(
    '/api/status',
    IsAuthenticated,
    isAdmin,
    isUserBanned,
    use(insertIp),
    ensuretfa,
    use(fetchNodeStatus),
    respondResult,
  );

  app.get(
    '/api/admin/balance',
    IsAuthenticated,
    isAdmin,
    isUserBanned,
    ensuretfa,
    use(fetchAdminBalance),
    respondResult,
  );

  app.get(
    '/api/admin/faucet/balance',
    IsAuthenticated,
    isAdmin,
    isUserBanned,
    ensuretfa,
    use(fetchAdminFaucetBalance),
    respondResult,
  );

  app.get(
    '/api/admin/liability',
    IsAuthenticated,
    isAdmin,
    isUserBanned,
    ensuretfa,
    use(fetchAdminLiability),
    respondResult,
  );

  app.post(
    '/api/signup/verify-email',
    use(insertIp),
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
    // rateLimiterMiddlewarePhone,
    // ensuretfa,
    // updateLastSeen,
    use(resendVerification),
  );

  app.post(
    '/api/signin',
    verifyMyCaptcha,
    // use(insertIp),
    requireSignin,
    isUserBanned,
    use(signin),
    createWalletsForUser,
    respondResult,
  );

  app.post(
    '/api/reset-password',
    verifyMyCaptcha,
    use(resetPassword),
    respondResult,
  );

  app.post(
    '/api/reset-password/verify',
    use(verifyResetPassword),
    respondResult,
  );

  app.post(
    '/api/reset-password/new',
    use(resetPasswordNew),
    respondResult,
  );

  app.post(
    '/api/2fa/enable',
    IsAuthenticated,
    isUserBanned,
    use(insertIp),
    ensuretfa,
    // updateLastSeen,
    use(enabletfa),
    respondResult,
  );

  app.post(
    '/api/2fa/disable',
    IsAuthenticated,
    use(insertIp),
    ensuretfa,
    // updateLastSeen,
    use(disabletfa),
    respondResult,
  );

  app.post(
    '/api/2fa/unlock',
    IsAuthenticated,
    isUserBanned,
    use(insertIp),
    use(unlocktfa),
    respondResult,
  );

  app.get(
    '/api/logout',
    use(insertIp),
    use(destroySession),
  );
};
