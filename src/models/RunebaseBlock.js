module.exports = (sequelize, DataTypes) => {
    // 1: The model schema.
    const modelDefinition = {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
        blockTime: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    };

    // 2: The model options.
    const modelOptions = {
        freezeTableName: true,
    };

    // 3: Define the Wallet model.
    const RunebaseBlockModel = sequelize.define('runebaseBlock', modelDefinition, modelOptions);

    RunebaseBlockModel.associate = (model) => {
        //RunebaseBlockModel.hasMany(model.transaction);
    };

    return RunebaseBlockModel;
};