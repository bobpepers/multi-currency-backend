module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('wallet', {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      available: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '0',
      },
      locked: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '0',
      },
      earned: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '0',
      },
      spend: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '0',
      },
      coinId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        onUpdate: 'CASCADE',
        references: {
          model: 'coin',
          key: 'id',
        },
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        onUpdate: 'CASCADE',
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
    await queryInterface.dropTable('wallet');
  },
};
