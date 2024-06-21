const Sequelize = require("sequelize");

const connection = new Sequelize("farm", "root", "T5u9w3p6#", {
  host: "35.239.71.4",
  port: "3306",
  dialect: "mysql",
  timezone: "-03:00",
  define: {
    timeStamps: false,
  } 
});

module.exports = connection;
    
