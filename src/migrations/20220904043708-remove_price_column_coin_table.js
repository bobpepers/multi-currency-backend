module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.removeColumn('coin', 'price');
  },
  down: async (queryInterface, DataTypes) => {
    await queryInterface.addColumn(
      'coin', // name of Target model
      'price', // name of the key we're adding
      {
        type: DataTypes.STRING,
        defaultValue: '0',
        allowNull: true,
      },
    );
  },
};
