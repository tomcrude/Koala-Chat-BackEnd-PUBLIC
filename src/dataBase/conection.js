const mysql = require("mysql")
const config = require("../config")

var pool  = mysql.createPool({
    connectionLimit : 50,
    host: config.host,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl:{
      rejectUnauthorized: false
    }
  });

  module.exports = pool;