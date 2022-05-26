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
    price: {
      type: DataTypes.STRING,
      defaultValue: '0',
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
    CoinModel.hasOne(model.withdrawalSetting);
  };

  return CoinModel;
};
