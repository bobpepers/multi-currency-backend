module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('faucet', {
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
      coinId: {
        type: DataTypes.BIGINT,
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        references: {
          model: 'coin',
          key: 'id',
        },
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    });
  },
  down: async (queryInterface, DataTypes) => {
    await queryInterface.dropTable('faucet');
  },
};
