const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Donation', {
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
        tip_donatie: {
            type: DataTypes.ENUM('one_time', 'lunar'),
            allowNull: false,
        },
        metoda_plata: {
            type: DataTypes.ENUM('smartpay', 'netopia'),
            allowNull: false,
            comment: "Metoda prin care s-a efectuat plata",
        }
    }, {
        tableName: 'donations',
        timestamps: true,
    });
};
