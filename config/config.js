require('dotenv').config();

module.exports = {
    development: {
        dialect: process.env.DB_DIALECT || 'sqlite',
        storage: process.env.DB_STORAGE || './identifier.sqlite',
        username: process.env.DB_USER || null,
        password: process.env.DB_PASSWORD || null,
        database: process.env.DB_NAME || null,
        host: process.env.DB_HOST || null,
        port: process.env.DB_PORT || null,
        logging: console.log,
    },
    test: {
        dialect: 'sqlite',
        storage: ':memory:',
        logging: false,
    },
    production: {
        dialect: process.env.DB_DIALECT || 'mysql',
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        logging: false,
    },
};
