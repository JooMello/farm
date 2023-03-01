
const Sequelize = require("sequelize");
const connection = require("../../../database/database");
const Investidor = require("../../investidor/Investidor")


const Saida = connection.define("saidas", {
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


Investidor.hasMany(Saida);
Saida.belongsTo(Investidor);

//Saida.sync({ force: true });


module.exports = Saida;
