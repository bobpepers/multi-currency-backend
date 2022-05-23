module.exports = (sequelize, DataTypes) => {
  const modelDefinition = {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    tokenExpires: {
      type: DataTypes.DATE,
    },
    token: {
      type: DataTypes.STRING,
    },
    confirmed: {
      type: DataTypes.BOOLEAN,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
    },
  };

  const modelOptions = {
    freezeTableName: true,
  };

  const WalletAddressExternalModel = sequelize.define('WalletAddressExternal', modelDefinition, modelOptions);

  WalletAddressExternalModel.associate = (model) => {
    WalletAddressExternalModel.belongsTo(model.addressExternal, { as: 'addressExternal' });
    WalletAddressExternalModel.belongsTo(model.wallet, { as: 'wallet' });
  };

  return WalletAddressExternalModel;
};
