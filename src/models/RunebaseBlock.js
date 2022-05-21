module.exports = (sequelize, DataTypes) => {
  // 1: The model schema.
  const modelDefinition = {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
    },
    blockTime: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  };

  const modelOptions = {
    freezeTableName: true,
  };

  const RunebaseBlockModel = sequelize.define('runebaseBlock', modelDefinition, modelOptions);

  RunebaseBlockModel.associate = (model) => {
    // RunebaseBlockModel.hasMany(model.transaction);
  };

  return RunebaseBlockModel;
};
