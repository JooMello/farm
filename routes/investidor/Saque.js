
const Sequelize = require("sequelize");
const connection = require("../../database/database")
const Investidor = require("./Investidor")


const Saque = connection.define('saques', {
    data: {
        type: Sequelize.STRING,
        allowNull: false
    }, 
     valor: {
        type: Sequelize.STRING,
        allowNull: false
    },
}) 


Investidor.hasMany(Saque);
Saque.belongsTo(Investidor);

//Saque.sync({ force: true });


module.exports = Saque;
