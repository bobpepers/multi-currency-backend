module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('withdrawalSetting', {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      min: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 10000000,
      },
      fee: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 50,
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
    await queryInterface.dropTable('withdrawalSetting');
  },
};
