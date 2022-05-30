module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.addColumn(
      'address', // name of Target model
      'memo', // name of the key we're adding
      {
        type: DataTypes.STRING,
        allowNull: true,
      },
    );
  },
  down: async (queryInterface, DataTypes) => {
    await queryInterface.removeColumn('address', 'memo');
  },
};
