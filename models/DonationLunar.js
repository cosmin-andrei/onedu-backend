// models/DonationLunar.js
module.exports = (sequelize, DataTypes) => {
    const DonationLunar = sequelize.define('DonationLunar', {
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
        data_final: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        stare: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'pending',
        },
    }, {
        tableName: 'donations_Lunar',
        timestamps: true,
    });
    

    return DonationLunar;
};
