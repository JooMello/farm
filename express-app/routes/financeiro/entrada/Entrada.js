
const Sequelize = require("sequelize");
const connection = require("../../../database/database");
const Investidor = require("../../investidor/Investidor")


const Entrada = connection.define("entradas", {
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


Investidor.hasMany(Entrada);
Entrada.belongsTo(Investidor);

//Entrada.sync({ force: true });


module.exports = Entrada;
