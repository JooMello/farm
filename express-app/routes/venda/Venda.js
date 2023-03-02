
const Sequelize = require("sequelize");
const connection = require("../../database/database");
const Investidor = require("../investidor/Investidor")

const Venda = connection.define('vendas', {
    data: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },
    quantidade: {
        type: Sequelize.STRING,
        allowNull: false
    },
    valor: {
         type: Sequelize.STRING,
        allowNull: false
    },
    dolar: {
         type: Sequelize.STRING,
        allowNull: false
    },
    amount: {
         type: Sequelize.STRING,
        allowNull: false
    },
    obs: {
        type: Sequelize.STRING,
        allowNull: false,
      },
});

// UM Investidor tem muitas vendas
// UMA Venda pertence a uma Investidor

Investidor.hasMany(Venda);
Venda.belongsTo(Investidor);

//Venda.sync({ force: true });

module.exports = Venda;