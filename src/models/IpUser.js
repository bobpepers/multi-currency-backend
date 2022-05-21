module.exports = (sequelize, DataTypes) => {
  const modelDefinition = {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    ipId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  };

  const modelOptions = {
    freezeTableName: true,
  };

  const IpUserModel = sequelize.define('IpUser', modelDefinition, modelOptions);

  IpUserModel.associate = (model) => {
    IpUserModel.belongsTo(model.ip, {
      as: 'ip',
      foreignKey: 'ipId',
    });

    IpUserModel.belongsTo(model.user, {
      as: 'user',
      foreignKey: 'userId',
    });
  };

  return IpUserModel;
};
