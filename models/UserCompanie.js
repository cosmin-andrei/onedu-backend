module.exports = (sequelize, DataTypes) => {
    return sequelize.define('UserCompanie', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        forma_adresare: DataTypes.STRING,
        prenume: DataTypes.STRING,
        nume: DataTypes.STRING,
        email: DataTypes.STRING,
        telefon: DataTypes.STRING,
        pozitia: DataTypes.STRING,
        CUI: {
            type: DataTypes.STRING,
            allowNull: true,
            references: {
                model: 'Companie',
                key: 'CUI',
            },
        },
    }, {
        tableName: 'UserCompanie',
    });
};
