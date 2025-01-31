module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Companie', {
        CUI: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
        },
        nume: DataTypes.STRING,
        nrRegComertului: DataTypes.STRING,
        adresa: DataTypes.STRING,
        oras: DataTypes.STRING,
        judet: DataTypes.STRING,
        idReprezentantLegal: {
            type: DataTypes.INTEGER,
            references: {
                model: 'UserCompanie', // Asigură-te că modelul UserCompanie este corect definit
                key: 'id',
            },
        },
        banca: DataTypes.STRING,
        IBAN: DataTypes.STRING,
    }, {
        tableName: 'Companie', // Numele explicit al tabelei
    });
};
