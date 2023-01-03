const express = require('express');
const router = express.Router();
const slugify = require("slugify");
const sequelize = require("sequelize");
const { Op } = require("sequelize");

const Investidor = require("../investidor/Investidor");
const Compra = require('../compra/Compra');
const Venda = require('../venda/Venda');


router.get('/admin/relatorios', async (req, res, next) => {

  //filtragem de dados, por peridodo que eles foram adicionados no BD
  //formatar numeros em valores decimais (.toLocaleFixed(2))
  Number.prototype.toLocaleFixed = function (n) {
    return this.toLocaleString(undefined, {
      minimumFractionDigits: n,
      maximumFractionDigits: n
    });
  };

    Compra.findAll().then((compras) => {
  Venda.findAll().then((vendas) => {
    Investidor.findAll().then(async (investidores) => {

       //////////////////////Quantidade
    var amountQ = await Venda.findOne({
      attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
      
      raw: true
    });
    var quantidade = (Number(amountQ['sum(`quantidade`)']))

      //////////////////////Unitário
      var amountU = await Venda.findOne({
        attributes: [sequelize.fn("avg", sequelize.col("unitario"))],
      
        raw: true
      });
      var unitarioT = (Number(amountU['avg(`unitario`)']))
      var unitario = (Number(amountU['avg(`unitario`)'])).toLocaleFixed(2);

      /////Valor da Venda
    var amountVv = await Venda.findOne({
      attributes: [sequelize.fn("sum", sequelize.col("total"))],
     
      raw: true
    });
    var amountVT = (Number(amountVv['sum(`total`)']))
    var amountV = (Number(amountVv['sum(`total`)'])).toLocaleFixed(2);
      
          //////////////////////Capital Investidor
    var amountT = await Compra.findOne({
      attributes: [sequelize.fn("sum", sequelize.col("total"))],
     
      raw: true
    });
    var CapitalInvestidoT = (Number(amountT['sum(`total`)']))
    var CapitalInvestido = (Number(amountT['sum(`total`)'])).toLocaleFixed(2);

    ///Investimento sobre a Venda
    var InvVenda = ((Number(CapitalInvestidoT) / Number(amountVT)) * (100)).toLocaleFixed(2);
  
    ///Lucro sobre Investimento
    var LucroN = (Number(amountVT) - Number(CapitalInvestidoT));
    var Lucro = (Number(amountVT) - Number(CapitalInvestidoT)).toLocaleFixed(2);

    ///Lucro sobre investimento Fazenda
    var LucroFN = (Number(LucroN) / 2)
    var LucroF = (Number(LucroN) / 2).toLocaleFixed(2);

    //Percentual Fazenda 
    var percentualF = ((Number(LucroFN) / Number(LucroN)) * (100)).toLocaleFixed(2);

      res.render('admin/relatorios/index', {
        compras: compras,
        vendas: vendas,
        investidores: investidores,
        quantidade, unitario, amountV, CapitalInvestido, InvVenda, Lucro,
        LucroF, percentualF,
      });
    })
  })
  })
});


module.exports = router;
