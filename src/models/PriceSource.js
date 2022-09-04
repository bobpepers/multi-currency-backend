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
  };

  const modelOptions = {
    freezeTableName: true,
  };

  const PriceSourceModel = sequelize.define('priceSource', modelDefinition, modelOptions);

  PriceSourceModel.associate = (model) => {
    PriceSourceModel.hasMany(model.CoinPriceSource);
    PriceSourceModel.belongsToMany(
      model.coin,
      { through: 'CoinPriceSource' },
    );
  };

  return PriceSourceModel;
};
