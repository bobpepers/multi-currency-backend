module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'addressExternal',
      'coinId',
      {
        type: Sequelize.BIGINT,
        references: {
          model: 'coin',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
    );
  },
  down: async (queryInterface, DataTypes) => {
    await queryInterface.removeColumn('addressExternal', 'coinId');
  },
};
