module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('WalletAddressExternal', {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      walletId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'wallet',
          key: 'id',
        },
      },
      addressExternalId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'addressExternal',
          key: 'id',
        },
      },
      tokenExpires: {
        type: DataTypes.DATE,
      },
      token: {
        type: DataTypes.STRING,
      },
      confirmed: {
        type: DataTypes.BOOLEAN,
      },
      enabled: {
        type: DataTypes.BOOLEAN,
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
    await queryInterface.dropTable('WalletAddressExternal');
  },
};
