module.exports = (sequelize, DataTypes) => {
  // 1: The model schema.
  const modelDefinition = {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    min: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '10000000',
    },
    fee: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 50,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  };

  // 2: The model options.
  const modelOptions = {
    freezeTableName: true,
  };

  // 3: Define the Wallet model.
  const WithdrawalSettingsModel = sequelize.define('withdrawalSetting', modelDefinition, modelOptions);

  WithdrawalSettingsModel.associate = (model) => {
    WithdrawalSettingsModel.belongsTo(model.coin);
    WithdrawalSettingsModel.belongsTo(model.user);
  };

  return WithdrawalSettingsModel;
};
