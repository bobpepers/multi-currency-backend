import {
  Sequelize,
  Op,
} from 'sequelize';
import db from '../../../models';

export const getLiability = async () => {
  // 1
  // Runebase init vars
  let availableRunebase = 0;
  let lockedRunebase = 0;
  let unconfirmedDepositsRunebase = 0;
  let unconfirmledWithdrawalsRunebase = 0;
  let faucetAmountRunebase = 0;

  // Pirate init vars
  let availablePirate = 0;
  let lockedPirate = 0;
  let unconfirmedDepositsPirate = 0;
  let unconfirmledWithdrawalsPirate = 0;
  let faucetAmountPirate = 0;

  // Tokel init vars
  let availableTokel = 0;
  let lockedTokel = 0;
  let unconfirmedDepositsTokel = 0;
  let unconfirmledWithdrawalsTokel = 0;
  let faucetAmountTokel = 0;

  // Lumens init vars
  let availableLumens = 0;
  let lockedLumens = 0;
  let unconfirmedDepositsLumens = 0;
  let unconfirmledWithdrawalsLumens = 0;
  let faucetAmountLumens = 0;

  // DogeLumens init vars
  let availableDogeLumens = 0;
  let lockedDogeLumens = 0;
  let unconfirmedDepositsDogeLumens = 0;
  let unconfirmledWithdrawalsDogeLumens = 0;
  let faucetAmountDogeLumens = 0;

  // 2
  // Runebase FetchDB
  const sumAvailableRunebase = await db.wallet.findAll({
    attributes: [
      [Sequelize.fn('sum', Sequelize.col('available')), 'total_available'],
    ],
    group: 'coin.id',
    include: [
      {
        model: db.coin,
        as: 'coin',
        required: true,
        attributes: ['id'],
        where: {
          ticker: 'RUNES',
        },
      },
    ],
  });

  const sumLockedRunebase = await db.wallet.findAll({
    attributes: [
      [Sequelize.fn('sum', Sequelize.col('locked')), 'total_locked'],
    ],
    group: 'coin.id',
    include: [
      {
        model: db.coin,
        as: 'coin',
        required: true,
        attributes: ['id'],
        where: {
          ticker: 'RUNES',
        },
      },
    ],
  });

  const sumUnconfirmedDepositsRunebase = await db.transaction.findAll({
    attributes: [
      [Sequelize.fn('sum', Sequelize.col('amount')), 'total_amount'],
    ],
    group: 'wallet.coin.id',
    include: [
      {
        model: db.wallet,
        as: 'wallet',
        required: true,
        attributes: [],
        include: [
          {
            model: db.coin,
            as: 'coin',
            required: true,
            attributes: ['id'],
            where: {
              ticker: 'RUNES',
            },
          },
        ],
      },
    ],
    where: {
      [Op.and]: [
        {
          type: 'receive',
        },
        {
          phase: 'confirming',
        },
      ],
    },
  });

  const sumUnconfirmedWithdrawalsRunebase = await db.transaction.findAll({
    attributes: [
      [Sequelize.fn('sum', Sequelize.col('amount')), 'total_amount'],
    ],
    group: 'wallet.id',
    include: [
      {
        model: db.wallet,
        as: 'wallet',
        required: true,
        attributes: [],
        include: [
          {
            model: db.coin,
            as: 'coin',
            required: true,
            attributes: ['id'],
            where: {
              ticker: 'RUNES',
            },
          },
        ],
      },
    ],
    where: {
      [Op.and]: [
        {
          type: 'send',
        },
        {
          phase: 'confirming',
        },
      ],
    },
  });

  const faucetRunebase = await db.faucet.findOne({
    include: [
      {
        model: db.coin,
        as: 'coin',
        required: true,
        attributes: [],
        where: {
          ticker: 'RUNES',
        },
      },
    ],
  });

  // Pirate FetchDB

  const sumAvailablePirate = await db.wallet.findAll({
    attributes: [
      [Sequelize.fn('sum', Sequelize.col('available')), 'total_available'],
    ],
    group: 'coin.id',
    include: [
      {
        model: db.coin,
        as: 'coin',
        required: true,
        attributes: ['id'],
        where: {
          ticker: 'ARRR',
        },
      },
    ],
  });

  const sumLockedPirate = await db.wallet.findAll({
    attributes: [
      [Sequelize.fn('sum', Sequelize.col('locked')), 'total_locked'],
    ],
    group: 'coin.id',
    include: [
      {
        model: db.coin,
        as: 'coin',
        required: true,
        attributes: ['id'],
        where: {
          ticker: 'ARRR',
        },
      },
    ],
  });

  const sumUnconfirmedDepositsPirate = await db.transaction.findAll({
    attributes: [
      [Sequelize.fn('sum', Sequelize.col('amount')), 'total_amount'],
    ],
    group: 'wallet.coin.id',
    include: [
      {
        model: db.wallet,
        as: 'wallet',
        required: true,
        attributes: [],
        include: [
          {
            model: db.coin,
            as: 'coin',
            required: true,
            attributes: ['id'],
            where: {
              ticker: 'ARRR',
            },
          },
        ],
      },
    ],
    where: {
      [Op.and]: [
        {
          type: 'receive',
        },
        {
          phase: 'confirming',
        },
      ],
    },
  });

  const sumUnconfirmedWithdrawalsPirate = await db.transaction.findAll({
    attributes: [
      [Sequelize.fn('sum', Sequelize.col('amount')), 'total_amount'],
    ],
    group: 'wallet.id',
    include: [
      {
        model: db.wallet,
        as: 'wallet',
        required: true,
        attributes: [],
        include: [
          {
            model: db.coin,
            as: 'coin',
            required: true,
            attributes: ['id'],
            where: {
              ticker: 'ARRR',
            },
          },
        ],
      },
    ],
    where: {
      [Op.and]: [
        {
          type: 'send',
        },
        {
          phase: 'confirming',
        },
      ],
    },
  });

  const faucetPirate = await db.faucet.findOne({
    include: [
      {
        model: db.coin,
        as: 'coin',
        required: true,
        attributes: [],
        where: {
          ticker: 'ARRR',
        },
      },
    ],
  });

  // Tokel FetchDB

  const sumAvailableTokel = await db.wallet.findAll({
    attributes: [
      [Sequelize.fn('sum', Sequelize.col('available')), 'total_available'],
    ],
    group: 'coin.id',
    include: [
      {
        model: db.coin,
        as: 'coin',
        required: true,
        attributes: ['id'],
        where: {
          ticker: 'TKL',
        },
      },
    ],
  });

  const sumLockedTokel = await db.wallet.findAll({
    attributes: [
      [Sequelize.fn('sum', Sequelize.col('locked')), 'total_locked'],
    ],
    group: 'coin.id',
    include: [
      {
        model: db.coin,
        as: 'coin',
        required: true,
        attributes: ['id'],
        where: {
          ticker: 'TKL',
        },
      },
    ],
  });

  const sumUnconfirmedDepositsTokel = await db.transaction.findAll({
    attributes: [
      [Sequelize.fn('sum', Sequelize.col('amount')), 'total_amount'],
    ],
    group: 'wallet.coin.id',
    include: [
      {
        model: db.wallet,
        as: 'wallet',
        required: true,
        attributes: [],
        include: [
          {
            model: db.coin,
            as: 'coin',
            required: true,
            attributes: ['id'],
            where: {
              ticker: 'TKL',
            },
          },
        ],
      },
    ],
    where: {
      [Op.and]: [
        {
          type: 'receive',
        },
        {
          phase: 'confirming',
        },
      ],
    },
  });

  const sumUnconfirmedWithdrawalsTokel = await db.transaction.findAll({
    attributes: [
      [Sequelize.fn('sum', Sequelize.col('amount')), 'total_amount'],
    ],
    group: 'wallet.id',
    include: [
      {
        model: db.wallet,
        as: 'wallet',
        required: true,
        attributes: [],
        include: [
          {
            model: db.coin,
            as: 'coin',
            required: true,
            attributes: ['id'],
            where: {
              ticker: 'TKL',
            },
          },
        ],
      },
    ],
    where: {
      [Op.and]: [
        {
          type: 'send',
        },
        {
          phase: 'confirming',
        },
      ],
    },
  });

  const faucetTokel = await db.faucet.findOne({
    include: [
      {
        model: db.coin,
        as: 'coin',
        required: true,
        attributes: [],
        where: {
          ticker: 'TKL',
        },
      },
    ],
  });
  // Lumens FetchDB

  const sumAvailableLumens = await db.wallet.findAll({
    attributes: [
      [Sequelize.fn('sum', Sequelize.col('available')), 'total_available'],
    ],
    group: 'coin.id',
    include: [
      {
        model: db.coin,
        as: 'coin',
        required: true,
        attributes: ['id'],
        where: {
          ticker: 'XLM',
        },
      },
    ],
  });

  const sumLockedLumens = await db.wallet.findAll({
    attributes: [
      [Sequelize.fn('sum', Sequelize.col('locked')), 'total_locked'],
    ],
    group: 'coin.id',
    include: [
      {
        model: db.coin,
        as: 'coin',
        required: true,
        attributes: ['id'],
        where: {
          ticker: 'XLM',
        },
      },
    ],
  });

  const sumUnconfirmedDepositsLumens = await db.transaction.findAll({
    attributes: [
      [Sequelize.fn('sum', Sequelize.col('amount')), 'total_amount'],
    ],
    group: 'wallet.coin.id',
    include: [
      {
        model: db.wallet,
        as: 'wallet',
        required: true,
        attributes: [],
        include: [
          {
            model: db.coin,
            as: 'coin',
            required: true,
            attributes: ['id'],
            where: {
              ticker: 'XLM',
            },
          },
        ],
      },
    ],
    where: {
      [Op.and]: [
        {
          type: 'receive',
        },
        {
          phase: 'confirming',
        },
      ],
    },
  });

  const sumUnconfirmedWithdrawalsLumens = await db.transaction.findAll({
    attributes: [
      [Sequelize.fn('sum', Sequelize.col('amount')), 'total_amount'],
    ],
    group: 'wallet.id',
    include: [
      {
        model: db.wallet,
        as: 'wallet',
        required: true,
        attributes: [],
        include: [
          {
            model: db.coin,
            as: 'coin',
            required: true,
            attributes: ['id'],
            where: {
              ticker: 'XLM',
            },
          },
        ],
      },
    ],
    where: {
      [Op.and]: [
        {
          type: 'send',
        },
        {
          phase: 'confirming',
        },
      ],
    },
  });

  const faucetLumens = await db.faucet.findOne({
    include: [
      {
        model: db.coin,
        as: 'coin',
        required: true,
        attributes: [],
        where: {
          ticker: 'XLM',
        },
      },
    ],
  });
  // DogeLumens FetchDB
  const sumAvailableDogeLumens = await db.wallet.findAll({
    attributes: [
      [Sequelize.fn('sum', Sequelize.col('available')), 'total_available'],
    ],
    group: 'coin.id',
    include: [
      {
        model: db.coin,
        as: 'coin',
        required: true,
        attributes: ['id'],
        where: {
          ticker: 'DXLM',
        },
      },
    ],
  });

  const sumLockedDogeLumens = await db.wallet.findAll({
    attributes: [
      [Sequelize.fn('sum', Sequelize.col('locked')), 'total_locked'],
    ],
    group: 'coin.id',
    include: [
      {
        model: db.coin,
        as: 'coin',
        required: true,
        attributes: ['id'],
        where: {
          ticker: 'DXLM',
        },
      },
    ],
  });

  const sumUnconfirmedDepositsDogeLumens = await db.transaction.findAll({
    attributes: [
      [Sequelize.fn('sum', Sequelize.col('amount')), 'total_amount'],
    ],
    group: 'wallet.coin.id',
    include: [
      {
        model: db.wallet,
        as: 'wallet',
        required: true,
        attributes: [],
        include: [
          {
            model: db.coin,
            as: 'coin',
            required: true,
            attributes: ['id'],
            where: {
              ticker: 'DXLM',
            },
          },
        ],
      },
    ],
    where: {
      [Op.and]: [
        {
          type: 'receive',
        },
        {
          phase: 'confirming',
        },
      ],
    },
  });

  const sumUnconfirmedWithdrawalsDogeLumens = await db.transaction.findAll({
    attributes: [
      [Sequelize.fn('sum', Sequelize.col('amount')), 'total_amount'],
    ],
    group: 'wallet.id',
    include: [
      {
        model: db.wallet,
        as: 'wallet',
        required: true,
        attributes: [],
        include: [
          {
            model: db.coin,
            as: 'coin',
            required: true,
            attributes: ['id'],
            where: {
              ticker: 'DXLM',
            },
          },
        ],
      },
    ],
    where: {
      [Op.and]: [
        {
          type: 'send',
        },
        {
          phase: 'confirming',
        },
      ],
    },
  });

  const faucetDogeLumens = await db.faucet.findOne({
    include: [
      {
        model: db.coin,
        as: 'coin',
        required: true,
        attributes: [],
        where: {
          ticker: 'DXLM',
        },
      },
    ],
  });
  // 3
  // Runebase Totals
  faucetAmountRunebase = faucetRunebase.amount ? faucetRunebase.amount : 0;
  availableRunebase = sumAvailableRunebase[0].dataValues.total_available ? sumAvailableRunebase[0].dataValues.total_available : 0;
  lockedRunebase = sumLockedRunebase[0].dataValues.total_locked ? sumLockedRunebase[0].dataValues.total_locked : 0;
  unconfirmedDepositsRunebase = sumUnconfirmedDepositsRunebase[0] && sumUnconfirmedDepositsRunebase[0].dataValues.total_amount ? sumUnconfirmedDepositsRunebase[0].dataValues.total_amount : 0;
  unconfirmledWithdrawalsRunebase = sumUnconfirmedWithdrawalsRunebase[0] && sumUnconfirmedWithdrawalsRunebase[0].dataValues.total_amount ? sumUnconfirmedWithdrawalsRunebase[0].dataValues.total_amount : 0;

  // Pirate Totals
  faucetAmountPirate = faucetPirate.amount ? faucetPirate.amount : 0;
  availablePirate = sumAvailablePirate[0].dataValues.total_available ? sumAvailablePirate[0].dataValues.total_available : 0;
  lockedPirate = sumLockedPirate[0].dataValues.total_locked ? sumLockedPirate[0].dataValues.total_locked : 0;
  unconfirmedDepositsPirate = sumUnconfirmedDepositsPirate[0] && sumUnconfirmedDepositsPirate[0].dataValues.total_amount ? sumUnconfirmedDepositsPirate[0].dataValues.total_amount : 0;
  unconfirmledWithdrawalsPirate = sumUnconfirmedWithdrawalsPirate[0] && sumUnconfirmedWithdrawalsPirate[0].dataValues.total_amount ? sumUnconfirmedWithdrawalsPirate[0].dataValues.total_amount : 0;

  // Tokel Totals
  faucetAmountTokel = faucetTokel.amount ? faucetTokel.amount : 0;
  availableTokel = sumAvailableTokel[0].dataValues.total_available ? sumAvailableTokel[0].dataValues.total_available : 0;
  lockedTokel = sumLockedTokel[0].dataValues.total_locked ? sumLockedTokel[0].dataValues.total_locked : 0;
  unconfirmedDepositsTokel = sumUnconfirmedDepositsTokel[0] && sumUnconfirmedDepositsTokel[0].dataValues.total_amount ? sumUnconfirmedDepositsTokel[0].dataValues.total_amount : 0;
  unconfirmledWithdrawalsTokel = sumUnconfirmedWithdrawalsTokel[0] && sumUnconfirmedWithdrawalsTokel[0].dataValues.total_amount ? sumUnconfirmedWithdrawalsTokel[0].dataValues.total_amount : 0;

  // Lumens Totals
  faucetAmountLumens = faucetLumens.amount ? faucetLumens.amount : 0;
  availableLumens = sumAvailableLumens[0].dataValues.total_available ? sumAvailableLumens[0].dataValues.total_available : 0;
  lockedLumens = sumLockedLumens[0].dataValues.total_locked ? sumLockedLumens[0].dataValues.total_locked : 0;
  unconfirmedDepositsLumens = sumUnconfirmedDepositsLumens[0] && sumUnconfirmedDepositsLumens[0].dataValues.total_amount ? sumUnconfirmedDepositsLumens[0].dataValues.total_amount : 0;
  unconfirmledWithdrawalsLumens = sumUnconfirmedWithdrawalsLumens[0] && sumUnconfirmedWithdrawalsLumens[0].dataValues.total_amount ? sumUnconfirmedWithdrawalsLumens[0].dataValues.total_amount : 0;

  // DogeLumens Totals
  faucetAmountDogeLumens = faucetDogeLumens.amount ? faucetDogeLumens.amount : 0;
  availableDogeLumens = sumAvailableDogeLumens[0].dataValues.total_available ? sumAvailableDogeLumens[0].dataValues.total_available : 0;
  lockedDogeLumens = sumLockedDogeLumens[0].dataValues.total_locked ? sumLockedDogeLumens[0].dataValues.total_locked : 0;
  unconfirmedDepositsDogeLumens = sumUnconfirmedDepositsDogeLumens[0] && sumUnconfirmedDepositsDogeLumens[0].dataValues.total_amount ? sumUnconfirmedDepositsDogeLumens[0].dataValues.total_amount : 0;
  unconfirmledWithdrawalsDogeLumens = sumUnconfirmedWithdrawalsDogeLumens[0] && sumUnconfirmedWithdrawalsDogeLumens[0].dataValues.total_amount ? sumUnconfirmedWithdrawalsDogeLumens[0].dataValues.total_amount : 0;

  const runesLiability = (((Number(availableRunebase) + Number(lockedRunebase)) + Number(unconfirmedDepositsRunebase)) - Number(unconfirmledWithdrawalsRunebase) + Number(faucetAmountRunebase));
  const arrrLiability = (((Number(availablePirate) + Number(lockedPirate)) + Number(unconfirmedDepositsPirate)) - Number(unconfirmledWithdrawalsPirate) + Number(faucetAmountPirate));
  const tklLiability = (((Number(availableTokel) + Number(lockedTokel)) + Number(unconfirmedDepositsTokel)) - Number(unconfirmledWithdrawalsTokel) + Number(faucetAmountTokel));
  const xlmLiability = (((Number(availableLumens) + Number(lockedLumens)) + Number(unconfirmedDepositsLumens)) - Number(unconfirmledWithdrawalsLumens) + Number(faucetAmountLumens));
  const dxlmLiability = (((Number(availableDogeLumens) + Number(lockedDogeLumens)) + Number(unconfirmedDepositsDogeLumens)) - Number(unconfirmledWithdrawalsDogeLumens) + Number(faucetAmountDogeLumens));

  return [
    runesLiability,
    arrrLiability,
    tklLiability,
    xlmLiability,
    dxlmLiability,
  ];
};
