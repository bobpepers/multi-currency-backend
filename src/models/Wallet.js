module.exports = (sequelize, DataTypes) => {
  const modelDefinition = {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    available: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '0',
    },
    locked: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '0',
    },
    earned: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '0',
    },
    spend: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '0',
    },
  };

  const modelOptions = {
    freezeTableName: true,
  };

  const WalletModel = sequelize.define('wallet', modelDefinition, modelOptions);

  WalletModel.associate = (model) => {
    WalletModel.belongsTo(model.user, { as: 'user' });
    WalletModel.belongsTo(model.coin, { as: 'coin' });
    // WalletModel.hasMany(model.address);
    WalletModel.hasOne(model.address);
    WalletModel.hasMany(model.transaction);
    WalletModel.hasMany(model.WalletAddressExternal);
    WalletModel.belongsToMany(
      model.addressExternal,
      { through: 'WalletAddressExternal' },
    );
  };

  return WalletModel;
};
