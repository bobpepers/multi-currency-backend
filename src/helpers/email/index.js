import nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import path from 'path';
import { config } from "dotenv";

config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false, // use SSL
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    requireTLS: true,
  },
});

const handlebarOptions = {
  viewEngine: {
    partialsDir: path.resolve(__dirname, 'views/'),
    defaultLayout: false,
  },
  viewPath: path.resolve(__dirname, 'views/'),
};

transporter.use('compile', hbs(handlebarOptions));

const sendEmail = (
  from,
  to,
  subject,
  template,
  context,
) => new Promise((resolve, reject) => {
  transporter.sendMail({
    from,
    to,
    subject,
    template,
    context,
  }, (error, info) => {
    if (error) {
      console.log(`error is ${error}`);
      resolve(false);
    } else {
      console.log(`Email sent: ${info.response}`);
      resolve(true);
    }
  });
});

const verifySend = () => new Promise((resolve, reject) => {
  transporter.verify((
    error,
    success,
  ) => {
    if (error) {
      resolve(false);
      console.log(error);
    } else {
      resolve(true);
    }
  });
});

export const sendVerificationEmail = async (
  username,
  email,
  token,
) => {
  const waitForVerify = await verifySend();
  if (!waitForVerify) {
    return false;
  }

  const waitForEmail = await sendEmail(
    process.env.MAIL_USER,
    email,
    'Verify Email',
    'verifyEmail',
    {
      base_url: process.env.ROOT_URL,
      username,
      email,
      token,
    },
  );
  return waitForEmail;
};

export const sendResetPassword = async (
  email,
  username,
  token,
) => {
  const waitForVerify = await verifySend();
  if (!waitForVerify) {
    return false;
  }

  const waitForEmail = await sendEmail(
    process.env.MAIL_USER,
    email,
    'Password Reset',
    'resetPassword',
    {
      base_url: process.env.ROOT_URL,
      email,
      username,
      token,
    },
  );
  return waitForEmail;
};

export const sendVerifyAddressEmail = async (
  email,
  username,
  token,
  coin,
  ticker,
  address,
) => {
  const waitForVerify = await verifySend();
  if (!waitForVerify) {
    return false;
  }

  const waitForEmail = await sendEmail(
    process.env.MAIL_USER,
    email,
    'Verify Withdrawal Address',
    'verifyWithdrawalAddress',
    {
      base_url: process.env.ROOT_URL,
      username,
      coin,
      ticker,
      token,
      address,
    },
  );
  return waitForEmail;
};
