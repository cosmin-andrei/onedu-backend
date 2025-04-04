module.exports = (sequelize, DataTypes) => {
    return sequelize.define('SmartPayTransaction', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        donationId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'donations',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        paymentId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        accessToken: {
            type: DataTypes.STRING,
            allowNull: false
        },
        refreshToken: {
            type: DataTypes.STRING,
            allowNull: false
        },
        recurring: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'pending'
        }
    }, {
        tableName: 'SmartPayTransactions',
        timestamps: true
    });
};
