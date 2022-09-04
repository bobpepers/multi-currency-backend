module.exports = (sequelize, DataTypes) => {
  const modelDefinition = {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    price: {
      type: DataTypes.STRING,
      defaultValue: '0',
      allowNull: false,
    },
    coinPriceSourceId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  };

  const modelOptions = {
    freezeTableName: true,
  };

  const CoinPriceSourceModel = sequelize.define('CoinPriceSource', modelDefinition, modelOptions);

  CoinPriceSourceModel.associate = (model) => {
    CoinPriceSourceModel.belongsTo(model.coin, { as: 'coin' });
    CoinPriceSourceModel.belongsTo(model.priceSource, { as: 'priceSource' });
  };

  return CoinPriceSourceModel;
};
