/* eslint-disable no-restricted-syntax */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkInsert('currency', [
        {
          id: 1,
          currency_name: "USD",
          iso: 'USD',
          type: 'FIAT',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ], {
        transaction,
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete('currency', [
        {
          id: 1,
        },
      ], {
        transaction,
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
