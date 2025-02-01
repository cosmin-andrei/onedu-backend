require('dotenv').config();

module.exports = {
    development: {
        dialect: 'sqlite',
        storage: './identifier.sqlite',
        logging: console.log,
    },
    test: {
        dialect: 'sqlite',
        storage: ':memory:',
        logging: false,
    },
    production: {
        dialect: 'mysql',
        username: process.env.DB_USER || 'onedu_apicor',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'onedu_onedu.ro',
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        logging: console.log,
        dialectOptions: {
            connectTimeout: 60000
        },
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
    }
};
