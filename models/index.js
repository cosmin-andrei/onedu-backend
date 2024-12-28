// backend/models/index.js
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config.js')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(config.database, config.username, config.password, {
    dialect: config.dialect,
    storage: config.storage, // Necesari pentru SQLite
    logging: config.logging
});

// Import modele
const User = require('./User')(sequelize, DataTypes);
const Administrator = require('./Administrator')(sequelize, DataTypes);
const MagicLink = require('./MagicLink')(sequelize, DataTypes);
const Formulare230 = require('./Formulare230')(sequelize, DataTypes);
const DonationOneTime = require('./DonationOneTime')(sequelize, DataTypes);
const DonationLunar = require('./DonationLunar')(sequelize, DataTypes);

// Define asocieri
User.hasOne(Administrator, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Administrator.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(MagicLink, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
MagicLink.belongsTo(User, { foreignKey: 'userId' });

User.associate = (models) => {
    User.hasMany(models.DonationOneTime, { foreignKey: 'idUser' });
    User.hasMany(models.DonationLunar, { foreignKey: 'idUser' });
};

DonationOneTime.associate = (models) => {
    DonationOneTime.belongsTo(models.User, { foreignKey: 'idUser' });
};

DonationLunar.associate = (models) => {
    DonationLunar.belongsTo(models.User, { foreignKey: 'idUser' });
};

// Export modele și conexiune
module.exports = {
    sequelize,
    User,
    Administrator,
    MagicLink,
    Formulare230,
    DonationOneTime,
    DonationLunar
};
