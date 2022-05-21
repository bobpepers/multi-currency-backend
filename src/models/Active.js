module.exports = (sequelize, DataTypes) => {
  const modelDefinition = {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    lastSeen: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  };

  const modelOptions = {
    freezeTableName: true,
  };

  const ActiveModel = sequelize.define('active', modelDefinition, modelOptions);

  ActiveModel.associate = (model) => {
    ActiveModel.belongsTo(model.user);
  };

  return ActiveModel;
};
