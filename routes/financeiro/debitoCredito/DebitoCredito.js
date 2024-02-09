const Sequelize = require("sequelize");
const connection = require("../../../database/database");
const Investidor = require("../../investidor/Investidor");

const DebitoCredito = connection.define("debitosCreditos", {
  data: {
    type: Sequelize.DATE,
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

Investidor.hasMany(DebitoCredito);
DebitoCredito.belongsTo(Investidor);

//DebitoCredito.sync({ force: true });

module.exports = DebitoCredito;
