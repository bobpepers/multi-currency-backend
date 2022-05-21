module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('activity', {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      type: {
        type: DataTypes.ENUM,
        values: [
          'depositAccepted',
          'depositComplete',
          'withdrawRequested',
          'withdrawAccepted',
          'withdrawComplete',
          'withdrawRejected',
          'login_s',
          'login_f',
          'logout_s',
        ],
      },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      spenderId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        references: {
          model: 'user',
          key: 'id',
        },
      },
      earnerId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        references: {
          model: 'user',
          key: 'id',
        },
      },
      spender_balance: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      earner_balance: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      failedAmount: {
        type: DataTypes.STRING(4000),
        allowNull: true,
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
    await queryInterface.dropTable('activity');
  },
};
