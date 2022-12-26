
const Sequelize = require("sequelize");
const connection = require("../../database/database");
const Investidor = require("../investidor/Investidor")

const DC = connection.define('dcs', {
    data: {
        type: Sequelize.DATE,
        allowNull: false
    },
    valor: {
        type: Sequelize.STRING,
        allowNull: false
    },
});

// UM Investidor tem muitas compras
// UMA Compra pertence a uma Investidor

Investidor.hasMany(DC);
DC.belongsTo(Investidor);

//DC.sync({ force: true });

module.exports = DC;