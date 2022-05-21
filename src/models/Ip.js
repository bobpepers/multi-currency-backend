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
    banned: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
  };

  const modelOptions = {
    freezeTableName: true,
  };

  const IpModel = sequelize.define('ip', modelDefinition, modelOptions);

  IpModel.associate = (model) => {
    IpModel.belongsToMany(model.user, {
      through: 'IpUser',
      as: 'users',
      foreignKey: 'ipId',
      otherKey: 'userId',
    });
  };

  return IpModel;
};
