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

import { isAdmin } from '../controllers/admin';
import { fetchUserInfo } from '../controllers/userInfo';
import { fetchLiability } from '../controllers/liability';
import { fetchBalance } from '../controllers/balance';
import { healthCheck } from '../controllers/health';
import { insertIp } from '../controllers/ip';
import { fetchErrors } from '../controllers/errors';
import { fetchNodeStatus } from '../controllers/status';
import { fetchActivity } from '../controllers/activity';
import { addNewWithdrawalAddress } from '../controllers/user/newWithdrawalAddress';
import { removeWithdrawalAddress } from '../controllers/user/removeWithdrawalAddress';
import { createWalletsForUser } from '../controllers/wallet';
import { verifyMyCaptcha } from '../controllers/recaptcha';
import { fetchTransactions } from '../controllers/transactions';
import { fetchUser } from '../controllers/user';

import {
  fetchWithdrawalAddress,
  fetchWithdrawalAddresses,
} from '../controllers/withdrawalAddresses';

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

// import {
//   fetchDashboardUsers,
// } from '../controllers/dashboardUsers';

// import {
//   fetchDeposits,
//   patchDeposits,
// } from '../controllers/deposits';

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

// import use(insertIp) from './helpers/use(insertIp)';

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
  const attachResSocketsClient = (req, res, next) => {
    res.locals.sockets = sockets;
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
    attachResSocketsClient,
    use(addNewWithdrawalAddress),
    respondResult,
  );

  app.post(
    '/api/withdraw/address/remove',
    IsAuthenticated,
    isUserBanned,
    use(insertIp),
    ensuretfa,
    attachResSocketsClient,
    use(removeWithdrawalAddress),
    respondResult,
  );

  app.post(
    '/api/withdraw/address/verify',
    // use(verifyWithdrawalAddress),
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

  // app.post(
  //   '/api/functions/deposits',
  //   IsAuthenticated,
  //   isAdmin,
  //   isUserBanned,
  //   use(insertIp),
  //   ensuretfa,
  //   use(fetchDeposits),
  //   respondCountAndResult,
  // );

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
    '/api/functions/errors',
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

  // app.post(
  //   '/api/management/dashboardusers',
  //   IsAuthenticated,
  //   isAdmin,
  //   isUserBanned,
  //   use(insertIp),
  //   ensuretfa,
  //   use(fetchDashboardUsers),
  //   respondCountAndResult,
  // );

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
    '/api/balance',
    IsAuthenticated,
    isAdmin,
    isUserBanned,
    ensuretfa,
    use(fetchBalance),
    respondResult,
  );

  app.get(
    '/api/liability',
    IsAuthenticated,
    isAdmin,
    isUserBanned,
    ensuretfa,
    use(fetchLiability),
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
    // use(insertIp),
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
