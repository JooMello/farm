
const Sequelize = require("sequelize");
const connection = require("../../database/database")


const Investidor = connection.define('investidores', {
    name: {
        type: Sequelize.STRING,
        allowNull: false
    }, 
     slug: {
        type: Sequelize.STRING,
        allowNull: false
    },
    phone: {
        type: Sequelize.STRING,
        allowNull: false
    }, email: {
        type: Sequelize.STRING,
        allowNull: false
    },
    cpf: {
        type: Sequelize.STRING,
        allowNull: false
    },
    cep: {
        type: Sequelize.STRING,
        allowNull: false
    },
    logradouro: {
        type: Sequelize.STRING,
        allowNull: false
    },  uf: {
        type: Sequelize.STRING,
        allowNull: false
    },  cidade: {
        type: Sequelize.STRING,
        allowNull: false
    },  number: {
        type: Sequelize.STRING,
        allowNull: false
    },  obs: {
        type: Sequelize.TEXT,
        allowNull: false
    },
}) 


//Investidor.sync({ force: true });


module.exports = Investidor;
