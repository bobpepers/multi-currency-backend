import db from '../../models';

export const fetchAdminWithdrawalSettings = async (
  req,
  res,
  next,
) => {
  const options = {
    order: [
      ['id', 'ASC'],
    ],
    limit: req.body.limit,
    offset: req.body.offset,
    include: [
      {
        model: db.coin,
        as: 'coin',
      },
    ],
  };

  res.locals.name = 'withdrawalSettings';
  // res.locals.count = await db.error.count(options);
  res.locals.result = await db.withdrawalSetting.findAll(options);
  next();
};

export const updateAdminWithdrawalSetting = async (
  req,
  res,
  next,
) => {
  const {
    id,
    min,
    fee,
  } = req.body;
  if (!id) {
    throw new Error("id is required");
  }
  if (!min) {
    throw new Error("minimum is required");
  }
  if (!fee) {
    throw new Error("fee is required");
  }
  const actualMin = Number((min * 1e8).toFixed(0));
  const actualFee = Number((fee * 1e2).toFixed(0));

  const withdrawalSetting = await db.withdrawalSetting.findOne({
    where: {
      id: req.body.id,
    },
    include: [
      {
        model: db.coin,
        as: 'coin',
      },
    ],
  });

  if (withdrawalSetting.coin.ticker === 'XLM') {
    if (actualMin < 150000000) {
      throw new Error("minumum cannot be lower then 1.5");
    }
    if (actualMin > 1000000000) {
      throw new Error("minumum cannot be higher then 10");
    }
    if (actualFee < 20) {
      throw new Error("fee cannot be lower then 0.2%");
    }
    if (actualFee > 500) {
      throw new Error("fee cannot be higher then 5%");
    }
  } else if (withdrawalSetting.coin.ticker === 'DXLM') {
    if (actualMin < 1500000000) {
      throw new Error("minumum cannot be lower then 15");
    }
    if (actualMin > 100000000000) {
      throw new Error("minumum cannot be higher then 1000");
    }
    if (actualFee < 20) {
      throw new Error("fee cannot be lower then 0.2%");
    }
    if (actualFee > 500) {
      throw new Error("fee cannot be higher then 5%");
    }
  } else if (withdrawalSetting.coin.ticker === 'ARRR') {
    if (actualMin < 10000000) {
      throw new Error("minumum cannot be lower then 0.1");
    }
    if (actualMin > 1000000000) {
      throw new Error("minumum cannot be higher then 10");
    }
    if (actualFee < 20) {
      throw new Error("fee cannot be lower then 0.2%");
    }
    if (actualFee > 500) {
      throw new Error("fee cannot be higher then 5%");
    }
  } else if (withdrawalSetting.coin.ticker === 'RUNES') {
    if (actualMin < 100000000) {
      throw new Error("minumum cannot be lower then 1");
    }
    if (actualMin > 100000000000) {
      throw new Error("minumum cannot be higher then 1000");
    }
    if (actualFee < 20) {
      throw new Error("fee cannot be lower then 0.2%");
    }
    if (actualFee > 500) {
      throw new Error("fee cannot be higher then 5%");
    }
  } else if (withdrawalSetting.coin.ticker === 'TKL') {
    if (actualMin < 1000000000) {
      throw new Error("minumum cannot be lower then 10");
    }
    if (actualMin > 100000000000) {
      throw new Error("minumum cannot be higher then 1000");
    }
    if (actualFee < 20) {
      throw new Error("fee cannot be lower then 0.2%");
    }
    if (actualFee > 500) {
      throw new Error("fee cannot be higher then 5%");
    }
  } else {
    if (actualMin < 100000000) {
      throw new Error("minumum cannot be lower then 1");
    }
    if (actualMin > 100000000000) {
      throw new Error("minumum cannot be higher then 1000");
    }
    if (actualFee < 20) {
      throw new Error("fee cannot be lower then 0.2%");
    }
    if (actualFee > 500) {
      throw new Error("fee cannot be higher then 5%");
    }
  }

  const updatedWithdrawalSetting = await withdrawalSetting.update({
    min: actualMin,
    fee: actualFee,
  });
  res.locals.name = 'updateWithdrawalSetting';
  res.locals.result = await db.withdrawalSetting.findOne({
    where: {
      id: updatedWithdrawalSetting.id,
    },
    include: [
      {
        model: db.coin,
        as: 'coin',
      },
    ],
  });
  next();
};
