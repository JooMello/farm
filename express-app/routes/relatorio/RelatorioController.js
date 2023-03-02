const express = require('express');
const router = express.Router();
const slugify = require("slugify");
const sequelize = require("sequelize");
const { Op } = require("sequelize");
const adminAuth = require("../../middlewares/adminAuth")

const Investidor = require("../investidor/Investidor");
const Compra = require('../compra/Compra');
const Venda = require('../venda/Venda');


router.get('/admin/relatorios', adminAuth, async (req, res, next) => {

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

      //////////////////////média valor
      var amountU = await Venda.findOne({
        attributes: [sequelize.fn("avg", sequelize.col("valor"))],
      
        raw: true
      });
      var unitarioT = (Number(amountU['avg(`valor`)']))
      var unitario = (Number(amountU['avg(`valor`)'])).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

      /////Valor da Venda
    var amountVv = await Venda.findOne({
      attributes: [sequelize.fn("sum", sequelize.col("valor"))],
     
      raw: true
    });
    var amountVT = (Number(amountVv['sum(`valor`)']))
    var amountV = (Number(amountVv['sum(`valor`)'])).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
      
          //////////////////////Capital Investidor
    var amountT = await Compra.findOne({
      attributes: [sequelize.fn("sum", sequelize.col("valor"))],
     
      raw: true
    });
    var CapitalInvestidoT = (Number(amountT['sum(`valor`)']))
    var CapitalInvestido = (Number(amountT['sum(`valor`)'])).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

    ///Investimento sobre a Venda
    var InvVenda = ((Number(CapitalInvestidoT) / Number(amountVT)) * (100)).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
  
    ///Lucro sobre Investimento
    var LucroN = (Number(amountVT) - Number(CapitalInvestidoT));
    var Lucro = (Number(amountVT) - Number(CapitalInvestidoT)).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

    ///Lucro sobre investimento Fazenda
    var LucroFN = (Number(LucroN) / 2)
    var LucroF = (Number(LucroN) / 2).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

    //Percentual Fazenda 
    var percentualF = ((Number(LucroFN) / Number(LucroN)) * (100)).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

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
