module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Sponsorizari', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        idCompanie: {
            type: DataTypes.STRING,
            references: {
                model: 'Companie', // Asigură-te că modelul Companie este corect definit
                key: 'CUI',
            },
        },
        data: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        suma: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
    }, {
        tableName: 'Sponsorizari', // Numele exact al tabelei
    });
};
