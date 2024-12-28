module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Formulare230', {
        nume: {
            type: DataTypes.STRING,
            allowNull: false
        },
        prenume: {
            type: DataTypes.STRING,
            allowNull: false
        },
        initiala_tatalui: { // Nou câmp adăugat
            type: DataTypes.STRING,
            allowNull: false
        },
        cnp: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true
            }
        },
        telefon: {
            type: DataTypes.STRING,
            allowNull: true
        },
        strada: {
            type: DataTypes.STRING,
            allowNull: false
        },
        numarul: {
            type: DataTypes.STRING,
            allowNull: false
        },
        bloc: {
            type: DataTypes.STRING,
            allowNull: true
        },
        scara: {
            type: DataTypes.STRING,
            allowNull: true
        },
        etaj: {
            type: DataTypes.STRING,
            allowNull: true
        },
        apartament: {
            type: DataTypes.STRING,
            allowNull: true
        },
        judet: {
            type: DataTypes.STRING,
            allowNull: false
        },
        oras: {
            type: DataTypes.STRING,
            allowNull: false
        },
        perioada_redirectionare: {
            type: DataTypes.STRING,
            allowNull: true
        },

        semnatura: {
            type: DataTypes.STRING,
            allowNull: true
        },
        data_completarii: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        newsletter: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        tableName: 'formulare230',
        timestamps: false
    });
};
