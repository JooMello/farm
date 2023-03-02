const express = require('express');
const router = express.Router();
const slugify = require("slugify");
const sequelize = require("sequelize");
const { Op } = require("sequelize");
const moment = require('moment');

const Investidor = require("../investidor/Investidor");
const Compra = require('../compra/Compra');
const Venda = require('../venda/Venda');
const Morte = require('../estoque/Estoque');
const adminAuth = require("../../middlewares/adminAuth")
const ContaCorrente = require("./../financeiro/contaCorrente/ContaCorrente")


router.get('/admin/estoque', adminAuth, async (req, res, next) => {

    //////////////////////mortes
    var amountQ = await Morte.findOne({
      attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
      raw: true
    });
    var morte = (Number(amountQ['sum(`quantidade`)']))

        //////////////////////Valor  mortes
        var amountQ = await Morte.findOne({
          attributes: [sequelize.fn("sum", sequelize.col("valor"))],
          raw: true
        });
        var valorf = (Number(amountQ['sum(`valor`)']))
        var valor = (Number(amountQ['sum(`valor`)'])).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

//////////////////////comprados
    var amountQc = await Compra.findOne({
      attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
      raw: true
    });
    var comprados = (Number(amountQc['sum(`quantidade`)']))
    
//////////////////////vendidos
var amountQv = await Venda.findOne({
  attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
  raw: true
});
var vendidos = (Number(amountQv['sum(`quantidade`)']))

//////////////////////estoque
var estoque = ((comprados) - (morte) - (vendidos));

    Compra.findAll({
        include: [{
            model: Investidor,
          }],
    }).then((compras) => {
  Venda.findAll({
    include: [{
        model: Investidor,
      }],
  }).then((vendas) => {
    Morte.findAll({
      include: [{
          model: Investidor,
        }],
    }).then((mortes) => {
    Investidor.findAll().then(async(investidores) => {
      var amountT = await ContaCorrente.findOne({
        attributes: [sequelize.fn("sum", sequelize.col("valor"))],
        raw: true,
      });
      var Totalf = Number(amountT["sum(`valor`)"])
      var Total = Number(amountT["sum(`valor`)"]).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})

      var amountU = await Compra.findOne({
        attributes: [
          [sequelize.fn("avg", sequelize.fn("DISTINCT", sequelize.col("valor"))), "media"]
        ],
        distinct: true,
        raw: true,
      });
      var MediaCompra = (Number(amountU['media'])).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

      var CapitalEstoque = ((Totalf) - (valorf)).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
      res.render('admin/estoque/index', {
        compras: compras,
        vendas: vendas,
        mortes: mortes,
        valor:valor,
        Total, MediaCompra, CapitalEstoque,
        investidores: investidores,
        morte,comprados,vendidos,estoque,
      });
    })
  })
  })
})
});

router.get('/admin/estoque/newMorte', adminAuth, (req, res) => {
    Investidor.findAll().then((investidores) => {
      res.render('admin/estoque/newMorte', {
        investidores: investidores,
      });
    });
  });

router.post('/morte/save',adminAuth,   (req, res) => {
    var data = req.body.data;
    var quantidade = req.body.quantidade;
    var valor = req.body.valor;
    var investidor = req.body.investidor;

    var valorFloat = valor.replace(".", "").replace(",", ".");
  
     Morte.create(
     {
      data: data,
      quantidade: quantidade,
      valor: valorFloat,
      investidoreId: investidor,
    })
    .then(() => {
      res.redirect("/admin/estoque");
    });
  });

router.get('/admin/estoque/morte', adminAuth, async (req, res, next) => {

    //////////////////////mortes
    var amountQ = await Morte.findOne({
      attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
      raw: true
    });
    var qmorte = (Number(amountQ['sum(`quantidade`)']))

        //////////////////////valor mortes
        var amountV = await Morte.findOne({
          attributes: [sequelize.fn("sum", sequelize.col("valor"))],
          raw: true
        });
        var qvalor = (Number(amountV['sum(`valor`)'])).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

    Morte.findAll({
      include: [{
          model: Investidor,
        }],
        order: [
          ["data", "DESC"]
        ],
        raw: true,
        nest: true,
    }).then((mortes) => {
      Compra.findAll({
        include: [{
            model: Investidor,
          }],
          order: [
            ["data", "DESC"]
          ],
          raw: true,
          nest: true,
      }).then((compras) => {
        mortes.forEach((morte) => {
          morte.data = moment(morte.data).format('DD/MM/YYYY');
        });
    Investidor.findAll().then((investidores) => {
      res.render('admin/estoque/morte', {
        mortes: mortes,
        compras: compras,
        investidores: investidores,
        qmorte,
        qvalor,
      });
    })
})
});
})

router.post('/morte/delete', adminAuth, (req, res) => {
  var id = req.body.id;
  if (id != undefined) {
    if (!isNaN(id)) {
      Morte.destroy({
        where: {
          id: id,
        },
      }).then(() => {
        res.redirect("/admin/estoque/morte");
      });
    } else {
      // NÃO FOR UM NÚMERO
      res.redirect("/admin/estoque/morte");
    }
  } else {
    // NULL
    res.redirect("/admin/estoque/morte");
  }
});

router.get("/admin/estoque/edit/:id", adminAuth, (req, res) => {
  var id = req.params.id;

Morte.findByPk(id)
.then((morte) => {
  if (morte != undefined) {

    Investidor.findAll().then((investidores) => {
    res.render('admin/estoque/edit', {
      morte: morte,
      investidores: investidores,
    })
  })
  } else{
    res.redirect('/admin/estoque/morte');
  }
})
.catch((err) => {
  res.redirect('/admin/estoque/morte');
})
})

router.post('/morte/update', adminAuth, (req, res) => {
  var id = req.body.id;
  var data = req.body.data;
  var quantidade = req.body.quantidade;
  var valor = req.body.valor;
  var investidor = req.body.investidor;

  var valorFloat = valor.replace(".", "").replace(",", ".");

  Morte.update({
    data: data,
    quantidade: quantidade,
    valor: valorFloat,
    investidoreId: investidor,
  }, {
    where: {
      id: id,
    }
  })
  .then(() => {
    res.redirect("/admin/estoque/morte");
  })
  .catch((err) => {
    res.send("erro:" + err);
  });
})


module.exports = router;
