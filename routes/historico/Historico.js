const Sequelize = require("sequelize");
const connection = require("../../database/database");
const Investidor = require("../investidor/Investidor");

const Historico = connection.define("historicos", {
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
    allowNull: false,
  },
  dolar: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  amount: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  obs: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  identificador: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  status: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

// UM Investidor tem muitas compras
// UMA Compra pertence a uma Investidor

Investidor.hasMany(Historico);
Historico.belongsTo(Investidor);

//Historico.sync({ force: true });

module.exports = Historico;
