const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class User extends Model {};

User.init({
  phone: {
    type: DataTypes.STRING
  }
}, {
  sequelize,
  modelName: 'user',
})

module.exports = User;