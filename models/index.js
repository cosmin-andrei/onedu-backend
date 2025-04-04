const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config.js')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const User = require('./User')(sequelize, DataTypes);
const Administrator = require('./Administrator')(sequelize, DataTypes);
const MagicLink = require('./MagicLink')(sequelize, DataTypes);
const Formulare230 = require('./Formulare230')(sequelize, DataTypes);
const BlogArticle = require('./BlogArticle')(sequelize, DataTypes);
const Companie = require('./Companie')(sequelize, DataTypes);
const UserCompanie = require('./UserCompanie')(sequelize, DataTypes);
const Sponsorizari = require('./Sponsorizari')(sequelize, DataTypes);
const Donation = require('./Donation')(sequelize, DataTypes);
const NetopiaTransaction = require('./NetopiaTransaction')(sequelize, DataTypes);
const SmartPayTransaction = require('./SmartPayTransaction')(sequelize, DataTypes);

User.hasOne(Administrator, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Administrator.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(MagicLink, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
MagicLink.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Donation, { foreignKey: 'idUser', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Donation.belongsTo(User, { foreignKey: 'idUser' });

Sponsorizari.belongsTo(Companie, { foreignKey: 'idCompanie', as: 'companie' });
Companie.hasMany(Sponsorizari, { foreignKey: 'idCompanie', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

Companie.hasOne(UserCompanie, {
    foreignKey: 'CUI',
    as: 'reprezentantLegal',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});
UserCompanie.belongsTo(Companie, {
    foreignKey: 'CUI',
    as: 'companie',
});

Donation.hasOne(SmartPayTransaction, { foreignKey: 'donationId', onDelete: 'CASCADE' });
SmartPayTransaction.belongsTo(Donation, { foreignKey: 'donationId' });

Donation.hasOne(NetopiaTransaction, { foreignKey: 'donationId', onDelete: 'CASCADE' });
NetopiaTransaction.belongsTo(Donation, { foreignKey: 'donationId' });

(async () => {
    await sequelize.authenticate();
    await sequelize.query("PRAGMA journal_mode = WAL;");
    console.log("🔄 SQLite WAL activat");
})();

module.exports = {
    sequelize,
    User,
    Administrator,
    MagicLink,
    Formulare230,
    Donation,
    BlogArticle,
    Companie,
    UserCompanie,
    Sponsorizari,
    NetopiaTransaction,
    SmartPayTransaction
};
