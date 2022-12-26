
const Sequelize = require("sequelize");
const connection = require("../../database/database");
const Investidor = require("../investidor/Investidor")

const Morte = connection.define('mortes', {
    data: {
        type: Sequelize.DATE,
        allowNull: false
    },
    quantidade: {
        type: Sequelize.STRING,
        allowNull: false
    },
});

// UM Investidor tem muitas compras
// UMA Compra pertence a uma Investidor

Investidor.hasMany(Morte);
Morte.belongsTo(Investidor);

//Morte.sync({ force: true });

module.exports = Morte;