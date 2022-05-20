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
    const TokelBlockModel = sequelize.define('tokelBlock', modelDefinition, modelOptions);

    TokelBlockModel.associate = (model) => {
        //TokelBlockModel.hasMany(model.transaction);
    };

    return TokelBlockModel;
};