module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.renameColumn('currency', 'currency_name', 'name');
  },
  down: async (queryInterface, DataTypes) => {
    await queryInterface.renameColumn('currency', 'name', 'currency_name');
  },
};
