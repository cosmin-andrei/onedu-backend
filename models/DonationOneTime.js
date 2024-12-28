// models/DonationOneTime.js
module.exports = (sequelize, DataTypes) => {
    const DonationOneTime = sequelize.define('DonationOneTime', {
        idUser: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
        },
        suma: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        data_ora_donatiei: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        stare: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'pending',
        },
    }, {
        tableName: 'donations_OneTime',
        timestamps: true,
    });

    return DonationOneTime;
};
