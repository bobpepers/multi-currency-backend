module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('address', {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      walletId: {
        type: DataTypes.BIGINT,
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        references: {
          model: 'wallet',
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
    await queryInterface.dropTable('address');
  },
};
