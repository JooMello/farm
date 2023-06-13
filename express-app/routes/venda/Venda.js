const Sequelize = require("sequelize");
const connection = require("../../database/database");
const Investidor = require("../investidor/Investidor");

<<<<<<< HEAD
const Venda = connection.define("vendas", {
  data: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  quantidade: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  valor: {
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
=======
const Venda = connection.define('vendas', {
    data: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },
    code: {
        type: Sequelize.STRING,
        allowNull: false,
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
>>>>>>> 0d2df215b0b0e5d57f5f939be02147518543ed55
});

// UM Investidor tem muitas vendas
// UMA Venda pertence a uma Investidor

Investidor.hasMany(Venda);
Venda.belongsTo(Investidor);

Venda.sync({ force: true });

module.exports = Venda;
