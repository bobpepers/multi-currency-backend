module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('IpUser', {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'user',
          key: 'id',
          as: 'users',
        },
      },
      ipId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'ip',
          key: 'id',
          as: 'ips',
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
    await queryInterface.dropTable('IpUser');
  },
};
