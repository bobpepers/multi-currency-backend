module.exports = (sequelize, DataTypes) => {
  const modelDefinition = {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ticker: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  };

  const modelOptions = {
    freezeTableName: true,
  };

  const CoinModel = sequelize.define('coin', modelDefinition, modelOptions);

  CoinModel.associate = (model) => {
    CoinModel.hasMany(model.wallet, {
      as: 'wallet',
    });
    CoinModel.hasMany(model.addressExternal, {
      as: 'addressExternal',
    });
    CoinModel.hasMany(model.transaction, {
      as: 'transactions',
    });
    CoinModel.hasOne(model.withdrawalSetting);
    CoinModel.hasOne(model.faucet);

    CoinModel.belongsToMany(
      model.priceSource,
      { through: 'CoinPriceSource' },
    );

    CoinModel.hasMany(model.CoinPriceSource);
  };

  return CoinModel;
};
