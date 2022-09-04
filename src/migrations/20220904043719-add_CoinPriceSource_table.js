module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('CoinPriceSource', {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      price: {
        type: DataTypes.STRING,
        defaultValue: '0',
        allowNull: false,
      },
      coinPriceSourceId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      coinId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'coin',
          key: 'id',
        },
      },
      priceSourceId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'priceSource',
          key: 'id',
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
    await queryInterface.dropTable('CoinPriceSource');
  },
};
