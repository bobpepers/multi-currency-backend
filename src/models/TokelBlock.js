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

  const TokelBlockModel = sequelize.define('tokelBlock', modelDefinition, modelOptions);

  TokelBlockModel.associate = (model) => {
    // TokelBlockModel.hasMany(model.transaction);
  };

  return TokelBlockModel;
};
