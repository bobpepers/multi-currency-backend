module.exports = (sequelize, DataTypes) => {
  const modelDefinition = {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    memo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  };

  const modelOptions = {
    freezeTableName: true,
  };

  const AddressModel = sequelize.define('address', modelDefinition, modelOptions);

  AddressModel.associate = (model) => {
    AddressModel.belongsTo(model.wallet, { as: 'wallet' });
    AddressModel.hasMany(model.transaction, {
      // as: 'transaction',
      // foreignKey: 'txId',
    });
  };

  return AddressModel;
};
