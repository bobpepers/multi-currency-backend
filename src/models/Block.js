module.exports = (sequelize, DataTypes) => {
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

  const BlockModel = sequelize.define('block', modelDefinition, modelOptions);

  BlockModel.associate = (model) => {
    // BlockModel.hasMany(model.transaction);
  };

  return BlockModel;
};
