module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('transaction', {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      txid: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM,
        values: [
          'receive',
          'send',
        ],
      },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      feeAmount: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      confirmations: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },
      phase: {
        type: DataTypes.ENUM,
        values: [
          'review',
          'pending',
          'confirming',
          'confirmed',
          'rejected',
          'failed',
        ],
      },
      to_from: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      memo: {
        type: DataTypes.STRING(512),
        allowNull: true,
      },
      addressExternalId: {
        type: DataTypes.BIGINT,
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        references: {
          model: 'addressExternal',
          key: 'id',
        },
      },
      userId: {
        type: DataTypes.BIGINT,
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        references: {
          model: 'user',
          key: 'id',
        },
      },
      addressId: {
        type: DataTypes.BIGINT,
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        references: {
          model: 'address',
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
    await queryInterface.dropTable('transaction');
  },
};
