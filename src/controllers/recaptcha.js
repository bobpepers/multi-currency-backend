import { config } from "dotenv";
import { Recaptcha } from 'recaptcha-v2';
import Bluebird from 'bluebird';

config();
/**
   * Verify ReCaptcha
   * @param {Object} recaptchaData
   * @returns {Promise}
   */
const verifyRecaptcha = (recaptchaData) => {
  if (process.env.RECAPTCHA_SKIP_ENABLED === 'true') { // For development purpose only, you need to add SKIP_ENABLED in .env
    return Bluebird.resolve();
  }
  return new Bluebird((resolve, reject) => {
    const recaptcha = new Recaptcha(process.env.RECAPTCHA_SITE_KEY, process.env.RECAPTCHA_SECRET_KEY, recaptchaData);

    recaptcha.verify((success) => {
      if (success) {
        console.log('successful');
        return resolve();
      }

      console.log('captcha-rejected');
      return reject();
    });
  });
};

/**
   * Verify ReCaptcha
   * @param {Object} recaptchaData
   * @returns {Promise}
   */
export const verifyMyCaptcha = (
  req,
  res,
  next,
) => {
  const { captchaResponse } = req.body;
  if (!captchaResponse) {
    return res.status(422).send({
      error: "CAPTCHA_REQUIRED",
    });
  }
  const recaptchaData = {
    remoteip: req.connection.remoteAddress,
    response: captchaResponse,
    secret: process.env.RECAPTCHA_SECRET_KEY,
  };

  verifyRecaptcha(recaptchaData).then(() => {
    console.log('Captcha Verified');
    return next();
  }).catch((error) => {
    console.log('invalid captcha');
    res.status(401).send({
      error: 'INVALID_CHAPTCHA',
    });
    console.log(error);
  });
};
