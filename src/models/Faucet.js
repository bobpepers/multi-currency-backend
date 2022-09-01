module.exports = (sequelize, DataTypes) => {
  const modelDefinition = {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    amount: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    totalAmountClaimed: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    claims: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  };

  // 2: The model options.
  const modelOptions = {
    freezeTableName: true,
  };

  // 3: Define the Wallet model.
  const FaucetModel = sequelize.define('faucet', modelDefinition, modelOptions);

  // 4: Wallet belongs to User

  FaucetModel.associate = (model) => {
    FaucetModel.hasMany(model.faucetTip);
    FaucetModel.belongsTo(model.coin);
  };

  // 5: Wallet has many addresses

  return FaucetModel;
};
