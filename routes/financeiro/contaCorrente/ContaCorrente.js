const Sequelize = require("sequelize");
const connection = require("../../../database/database");
const Investidor = require("../../investidor/Investidor");

const ContaCorrente = connection.define("contacorrente", {
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
  code: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

// UM Investidor tem muitas compras
// UMA Compra pertence a uma Investidor

Investidor.hasMany(ContaCorrente);
ContaCorrente.belongsTo(Investidor);

//ContaCorrente.sync({ force: true });

module.exports = ContaCorrente;
