// backend/models/Administrator.js
module.exports = (sequelize, DataTypes) => {
    const Administrator = sequelize.define('Administrator', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        }
    }, {
        tableName: 'Administrators',
        timestamps: false
    });

    return Administrator;
};
