import {
  Transaction,
  Op,
} from 'sequelize';
import { sendVerificationEmail } from '../helpers/email';
import db from '../models';
import { generateVerificationToken } from '../helpers/generate';
import timingSafeEqual from '../helpers/timingSafeEqual';

/**
 * Is Dashboard User Banned?
 */
export const isDashboardUserBanned = async (
  req,
  res,
  next,
) => {
  if (req.user.banned) {
    console.log('user is banned');
    req.logOut();
    req.session.destroy();
    res.status(401).send({
      error: 'USER_BANNED',
    });
  } else {
    next();
  }
};

/**
 * Sign in
 */
export const signin = async (
  req,
  res,
  next,
) => {
  const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  let activity;
  if (req.authErr === 'USER_NOT_EXIST') {
    throw new Error("User doesn't exist");
  }
  if (req.authErr === 'EMAIL_NOT_VERIFIED') {
    res.locals.email = req.user_email;
    const user = await db.user.findOne({
      where: {
        [Op.or]: [
          {
            email: req.user_email.toLowerCase(),
          },
        ],
      },
    });
    if (user) {
      const verificationToken = await generateVerificationToken(24);
      if (user.authused === true) {
        throw new Error("Authentication token already used");
      }
      const updatedUser = await user.update({
        authexpires: verificationToken.tomorrow,
        authtoken: verificationToken.authtoken,
      });
      const {
        email,
        authtoken,
      } = updatedUser;
      sendVerificationEmail(email, authtoken);
      req.session.destroy();
      res.status(401).send({
        error: req.authErr,
        email: res.locals.email,
      });
      throw new Error(req.authErr);
    }
  } else if (req.authErr) {
    req.session.destroy();
    throw new Error("LOGIN_ERROR");
  } else {
    const activity = await db.activity.create({
      earnerId: req.user.id,
      type: 'login_s',
      //  ipId: res.locals.ip[0].id,
    });
    res.locals.activity = await db.activity.findOne({
      where: {
        id: activity.id,
      },
      attributes: [
        'createdAt',
        'type',
      ],
      include: [
        {
          model: db.user,
          as: 'earner',
          required: false,
          attributes: ['username'],
        },
      ],
    });
    res.locals.result = req.user.username;
    return next();
  }
};

export const destroySession = async (
  req,
  res,
  next,
) => {
  const activity = await db.activity.create(
    {
      userId: req.user.id,
      type: 'logout_s',
      //     ipId: res.locals.ip[0].id,
    },
  );
  res.locals.activity = await db.activity.findOne({
    where: {
      id: activity.id,
    },
    attributes: [
      'createdAt',
      'type',
    ],
    include: [
      {
        model: db.user,
        as: 'user',
        required: false,
        attributes: ['username'],
      },
    ],
  });
  req.logOut();
  req.session.destroy();
  res.redirect("/");
  next();
};

/**
 * Sign up
 */
export const signup = async (req, res, next) => {
  const {
    email,
    password,
    username,
  } = req.body.props;

  if (!email || !password || !username) {
    throw new Error("all fields are required");
  }

  const textCharacters = new RegExp("^[a-zA-Z0-9]*$");
  if (!textCharacters.test(username)) {
    throw new Error("USERNAME_NO_SPACES_OR_SPECIAL_CHARACTERS_ALLOWED");
  }

  const User = await db.user.findOne({
    where: {
      [Op.or]: [
        {
          username,
        },
        {
          email: email.toLowerCase(),
        },
      ],
    },
  });

  if (User && User.username.toLowerCase() === username.toLowerCase()) {
    throw new Error("USERNAME_ALREADY_EXIST");
  }
  if (User && User.email.toLowerCase() === email.toLowerCase()) {
    throw new Error("EMAIL_ALREADY_EXIST");
  }

  await db.sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  }, async (t) => {
    const verificationToken = await generateVerificationToken(24);
    const newUser = await db.user.create({
      username,
      password,
      email: email.toLowerCase(),
      authused: false,
      authexpires: verificationToken.expires,
      authtoken: verificationToken.token,
    }, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    t.afterCommit(() => {
      sendVerificationEmail(email.toLowerCase(), newUser.authtoken);
      return res.json({
        email: email.toLowerCase(),
      });
      // next();
    });
  });
};

/**
 * Resend verification code
 */
export const resendVerification = async (
  req,
  res,
  next,
) => {
  console.log('resend verification');
  const { email } = req.body;
  db.user.findOne({
    where: {
      [Op.or]: [
        {
          email: email.toLowerCase(),
        },
      ],
    },
  }).then(async (user) => {
    const verificationToken = await generateVerificationToken(24);
    if (user.authused === true) {
      res.json({ success: false });
      return next('Auth Already Used');
    }
    user.update({
      authexpires: verificationToken.expires,
      authtoken: verificationToken.token,
    }).then((updatedUser) => {
      const { email, authtoken } = updatedUser;
      sendVerificationEmail(email.toLowerCase(), authtoken);
      res.json({ success: true });
    }).catch((err) => {
      next(err);
    });
  }).catch((err) => {
    next(err);
  });
};

/**
 * Verify email
 */
export const verifyEmail = (
  req,
  res,
  next,
) => {
  const {
    email,
    token,
  } = req.body;

  db.user.findOne({
    where: {
      [Op.or]: [
        {
          email: email.toLowerCase(),
        },
      ],
    },
  }).then((user) => {
    if (!user) {
      throw new Error('USER_NOT_EXIST');
    }
    if (user.authused > 0) {
      throw new Error('AUTH_TOKEN_ALREADY_USED');
    }
    if (new Date() > user.authexpires) {
      throw new Error('AUTH_TOKEN_EXPIRED');
    }
    if (!timingSafeEqual(token, user.authtoken)) {
      throw new Error('INCORRECT_TOKEN');
    }
    user.update({
      authused: true,
      role: 1,
    }).then(async (updatedUser) => {
      res.locals.user = updatedUser;
      next();
    }).catch((err) => {
      res.locals.error = err.message;
      next();
    });
  }).catch((err) => {
    res.locals.error = err.message;
    next();
  });
};
