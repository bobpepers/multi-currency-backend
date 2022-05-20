module.exports = (sequelize, DataTypes) => {
    const modelDefinition = {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        ticker: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        price: {
            type: DataTypes.STRING,
            defaultValue: '0',
            allowNull: true,
        },
    };

    // 2: The model options.
    const modelOptions = {
        freezeTableName: true,
    };

    // 3: Define the Domain model.
    const CoinModel = sequelize.define('coin', modelDefinition, modelOptions);

    CoinModel.associate = (model) => {
        CoinModel.hasMany(model.wallet, {
            as: 'wallet',
        });
    };

    return CoinModel;
};