module.exports = (sequelize, DataTypes) => {
    return sequelize.define('NetopiaTransaction', {
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
        envKey: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        data: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'pending'
        }
    }, {
        tableName: 'NetopiaTransactions',
        timestamps: true
    });
};
