import db from '../models';

/**
 *
 * Is IP Banned?
 */
export const isIpBanned = async (
  req,
  res,
  next,
) => {
  const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const banned = await db.ip.findOne({
    where: {
      address: ip,
      banned: true,
    },
  });
  console.log('isUserBaipnned');
  console.log(req.user);
  if (banned) {
    req.logOut();
    req.session.destroy();
    res.status(401).send({
      error: 'IP_BANNED',
    });
  } else {
    next();
  }
};

/**
 * insert Ip
 */

function upsert(values) {
  return db.IpUser.findOne({
    where: values,
  }).then((obj) => {
    // update
    if (obj) {
      console.log('update IpUserModel');
      obj.changed('updatedAt', true);
      return obj.save();
    }
    return db.IpUser.create(values);
  });
}

export const insertIp = async (req, res, next) => {
  let storedIP;
  const ip = req.headers['cf-connecting-ip']
    || req.headers['x-forwarded-for']
    || req.connection.remoteAddress
    || req.socket.remoteAddress
    || (req.connection.socket ? req.connection.socket.remoteAddress : null);

  storedIP = await db.ip.findOne({
    where: {
      address: ip,
    },
  });
  if (!storedIP) {
    storedIP = await db.ip.create({
      address: ip,
    });
  }
  if (req.user && req.user.id) {
    await upsert({
      userId: req.user.id,
      ipId: storedIP.id,
    });
  }

  res.locals.ip = ip;
  res.locals.ipId = storedIP.id;
  next();
};
