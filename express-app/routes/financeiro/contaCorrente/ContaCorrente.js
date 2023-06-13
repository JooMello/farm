const Sequelize = require("sequelize");
const connection = require("../../../database/database");
const Investidor = require("../../investidor/Investidor");

const ContaCorrente = connection.define("contaCorrente", {
  data: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  category: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  valor: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  obs: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

// UM Investidor tem muitas compras
// UMA Compra pertence a uma Investidor

Investidor.hasMany(ContaCorrente);
ContaCorrente.belongsTo(Investidor);

//ContaCorrente.sync({ force: true });

module.exports = ContaCorrente;
