module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Administrator', {
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
};
