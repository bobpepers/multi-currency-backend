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

  const PirateBlockModel = sequelize.define('pirateBlock', modelDefinition, modelOptions);

  PirateBlockModel.associate = (model) => {
    // PirateBlockModel.hasMany(model.transaction);
  };

  return PirateBlockModel;
};
