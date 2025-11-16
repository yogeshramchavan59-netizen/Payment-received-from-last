const { Sequelize } = require('sequelize');

const conn = new Sequelize(process.env.DB_CONNECTION_STRING, {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 30,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = conn;
