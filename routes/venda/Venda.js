const Sequelize = require("sequelize");
const connection = require("../../database/database");
const Investidor = require("../investidor/Investidor");

const Venda = connection.define("vendas", {
  data: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  code: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  brinco: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  quantidade: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  valor: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  totalAmount: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  peso: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  dolar: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  amount: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  mediaPonderada: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  valorInvestidor: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  valorFazenda: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  obs: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

// UM Investidor tem muitas vendas
// UMA Venda pertence a uma Investidor

Investidor.hasMany(Venda);
Venda.belongsTo(Investidor);

//Venda.sync({ force: true });

module.exports = Venda;
