const moment = require('moment-timezone');

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('MagicLink', {
        token: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        date_creation: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'MagicLinks',
        timestamps: false,
        hooks: {
            beforeCreate: (magicLink) => {
                magicLink.expiresAt = moment(magicLink.expiresAt).tz('Europe/Bucharest').toDate();
                magicLink.date_creation = moment().tz('Europe/Bucharest').toDate();
            }
        }
    });
};
