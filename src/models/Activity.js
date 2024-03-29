// LEGENDE
// _i = insufficient balance
// _s = Success
// _f = fail
// _t = time (for example: faucet claim too fast)
//
module.exports = (sequelize, DataTypes) => {
  const modelDefinition = {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.ENUM,
      values: [
        'depositAccepted',
        'depositComplete',
        'withdrawRequested',
        'withdrawAccepted',
        'withdrawComplete',
        'withdrawRejected',
        'login_s',
        'login_f',
        'logout_s',
        'withdraw_f',
      ],
    },
    amount: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    spender_balance: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    earner_balance: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    failedAmount: {
      type: DataTypes.STRING(4000),
      allowNull: true,
    },
  };

  const modelOptions = {
    freezeTableName: true,
  };

  const ActivityModel = sequelize.define('activity', modelDefinition, modelOptions);

  ActivityModel.associate = (model) => {
    // ActivityModel.belongsTo(model.user, {
    //   as: 'user',
    //   foreignKey: 'userId',
    // });
    ActivityModel.belongsTo(model.user, {
      as: 'spender',
      foreignKey: 'spenderId',
    });
    ActivityModel.belongsTo(model.user, {
      as: 'earner',
      foreignKey: 'earnerId',
    });
    ActivityModel.belongsTo(model.transaction, {
      as: 'transaction',
      foreignKey: 'transactionId',
    });
    ActivityModel.belongsTo(model.faucetTip, {
      as: 'faucetTip',
      foreignKey: 'faucetTipId',
    });
  };

  return ActivityModel;
};
