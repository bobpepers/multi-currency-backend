/* eslint-disable no-restricted-syntax */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkInsert('coin', [
        {
          name: 'Doge Lumens',
          ticker: `DXLM`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ], {
        transaction,
      });

      const coinId = await queryInterface.rawSelect(
        'coin',
        {
          where: {
            ticker: `DXLM`,
          },
          transaction,
        },
        [
          'id',
        ],
      );

      await queryInterface.bulkInsert('withdrawalSetting', [
        {
          coinId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ], {
        transaction,
      });

      await queryInterface.bulkInsert('faucet', [
        {
          amount: '0',
          totalAmountClaimed: '0',
          claims: '0',
          coinId,
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
      const coinId = await queryInterface.rawSelect(
        'coin',
        {
          where: {
            ticker: `DXLM`,
          },
          transaction,
        },
        [
          'id',
        ],
      );
      await queryInterface.bulkDelete('faucet', [
        {
          coinId,
        },
      ], {
        transaction,
      });
      await queryInterface.bulkDelete('withdrawalSetting', [
        {
          coinId,
        },
      ], {
        transaction,
      });
      await queryInterface.bulkDelete('ticker', [
        {
          ticker: `DXLM`,
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
