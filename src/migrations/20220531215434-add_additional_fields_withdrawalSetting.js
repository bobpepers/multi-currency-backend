module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.addColumn(
      'withdrawalSetting', // name of Target model
      'enabled', // name of the key we're adding
      {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    );
    await queryInterface.addColumn(
      'withdrawalSetting', // name of Target model
      'userId', // name of the key we're adding
      {
        type: DataTypes.BIGINT,
        references: {
          model: 'user', // name of Source model
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
    );
  },
  down: async (queryInterface, DataTypes) => {
    await queryInterface.removeColumn('withdrawalSetting', 'enabled');
    await queryInterface.removeColumn('withdrawalSetting', 'userId');
  },
};
