module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('faucetTip', {
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
      faucetId: {
        type: DataTypes.BIGINT,
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        references: {
          model: 'faucet',
          key: 'id',
        },
      },
      userId: {
        type: DataTypes.BIGINT,
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        references: {
          model: 'user',
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
    await queryInterface.dropTable('faucetTip');
  },
};
