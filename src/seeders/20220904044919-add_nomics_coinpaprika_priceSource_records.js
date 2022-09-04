/* eslint-disable no-restricted-syntax */
const { Op } = require("sequelize");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkInsert('priceSource', [
        {
          name: "coinpaprika",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "nomics",
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
      await queryInterface.bulkDelete('priceSource', [
        {
          [Op.or]: [
            { name: "coinpaprika" },
            { name: "nomics" },
          ],
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
