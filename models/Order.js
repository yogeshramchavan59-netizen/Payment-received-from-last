const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Order = db.define('Order', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  razorpayOrderId: { type: DataTypes.STRING, unique: true },
  razorpayPaymentId: { type: DataTypes.STRING },
  amount: { type: DataTypes.INTEGER }, // paise
  currency: { type: DataTypes.STRING, defaultValue: 'INR' },
  status: { type: DataTypes.STRING }, // created, paid, failed
  fileKey: { type: DataTypes.STRING }, // S3 key
  downloadTokenUsed: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  indexes: [{ fields: ['razorpayOrderId'] }]
});

module.exports = Order;
