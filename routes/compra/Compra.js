const Sequelize = require("sequelize");
const connection = require("../../database/database");
const Investidor = require("../investidor/Investidor");

const Compra = connection.define("compras", {
  data: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  code: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  identificador: {
    type: Sequelize.STRING,
    allowNull: true,
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
  obs: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  status: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

// UM Investidor tem muitas compras
// UMA Compra pertence a uma Investidor

Investidor.hasMany(Compra);
Compra.belongsTo(Investidor);

//Compra.sync({ force: true });

module.exports = Compra;
