// backend/config/config.js
require('dotenv').config();

module.exports = {
    development: {
        dialect: 'sqlite',
        storage: './identifier.sqlite',
        logging: console.log
    },
    test: {
        dialect: 'sqlite',
        storage: ':memory:',
        logging: false
    },
    production: {
        dialect: 'mysql',
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        logging: false
    }
};
