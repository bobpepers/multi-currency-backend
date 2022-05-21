module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'activity', // name of Target model
      'transactionId', // name of the key we're adding
      {
        type: Sequelize.BIGINT,
        references: {
          model: 'transaction', // name of Source model
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
    );
  },
  down: async (queryInterface, DataTypes) => {
    await queryInterface.removeColumn('activity', 'transactionId');
  },
};
