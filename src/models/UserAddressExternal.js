module.exports = (sequelize, DataTypes) => {
  const modelDefinition = {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
  };

  const modelOptions = {
    freezeTableName: true,
  };

  const AddressExternalModel = sequelize.define('UserAddressExternal', modelDefinition, modelOptions);

  AddressExternalModel.associate = (model) => {
  };

  return AddressExternalModel;
};
