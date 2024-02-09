const Sequelize = require("sequelize");

const connection = new Sequelize("farm", "root", "T5u9w3p6#", {
  host: "34.95.246.180",
  port: "3306",
  dialect: "mysql",
  timezone: "-03:00",
  define: {
    timeStamps: false,
  } 
});

module.exports = connection;
    