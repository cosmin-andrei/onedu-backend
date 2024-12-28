// backend/models/MagicLink.js
module.exports = (sequelize, DataTypes) => {
    const MagicLink = sequelize.define('MagicLink', {
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
        timestamps: false
    });

    return MagicLink;
};
