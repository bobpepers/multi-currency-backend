module.exports = (sequelize, DataTypes) => {
  const modelDefinition = {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      unique: false,
      allowNull: true,
    },
    firstname: {
      type: DataTypes.STRING,
      unique: false,
      allowNull: true,
    },
    lastname: {
      type: DataTypes.STRING,
      unique: false,
      allowNull: true,
    },
    role: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },
    ignoreMe: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    publicStats: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    banned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    banMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lastSeen: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    referral_count: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
  };

  const modelOptions = {
    freezeTableName: true,
  };

  const UserModel = sequelize.define('user', modelDefinition, modelOptions);

  UserModel.associate = (model) => {
    UserModel.hasMany(model.wallet);
    UserModel.hasMany(model.transaction);
    UserModel.hasMany(model.active, {
      foreignKey: 'userId',
      as: 'active',
    });
    UserModel.belongsToMany(
      model.addressExternal,
      { through: 'UserAddressExternal' },
    );
  };

  return UserModel;
};
