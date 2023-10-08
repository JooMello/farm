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
    raw: true,
  });
  var morte = Number(amountQ["sum(`quantidade`)"]);

  //////////////////////Valor  mortes
  var amountQ = await Morte.findOne({
    attributes: [sequelize.fn("sum", sequelize.col("valor"))],
    raw: true,
  });
  var valorf = Number(amountQ["sum(`valor`)"]);
  var valor = Number(amountQ["sum(`valor`)"]).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  //////////////////////comprados
  var comprados = await Compra.count();

  //////////////////////vendidos
  var vendidos = await Venda.count();

  //////////////////////estoque
  var estoque = comprados - morte - vendidos;

  Compra.findAll({
    include: [
      {
        model: Investidor,
      },
    ],
  }).then((compras) => {
    Venda.findAll({
      include: [
        {
          model: Investidor,
        },
      ],
    }).then((vendas) => {
      Morte.findAll({
        include: [
          {
            model: Investidor,
          },
        ],
      }).then((mortes) => {
        Investidor.findAll().then(async (investidores) => {
          //////////////////////Capital Investidor
          var amountC = await Compra.findOne({
            attributes: [sequelize.fn("sum", sequelize.col("valor"))],

            raw: true,
          });

          var amountV = await Venda.findOne({
            attributes: [sequelize.fn("sum", sequelize.col("valor"))],

            raw: true,
          });
           var TotalC = Number(amountC["sum(`valor`)"]);
           var TotalV = Number(amountV["sum(`valor`)"]) /2;
           const Totalf = (TotalC - TotalV);
          var Total = Totalf.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });

          var amountU = await Compra.findOne({
            attributes: [
              [sequelize.fn("sum", sequelize.col("valor")), "total_valor_compras"],
            ],
            raw: true,
          });
          var TotalValorCompras = Number(amountU["total_valor_compras"]);
      
          var MediaCompraPonderada = ((TotalValorCompras - valorf) / (estoque)).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });

          var CapitalEstoque = (Totalf - valorf).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });
          res.render("admin/estoque/index", {
            compras: compras,
            vendas: vendas,
            mortes: mortes,
            valor: valor,
            Total,
            MediaCompraPonderada,
            CapitalEstoque,
            investidores: investidores,
            morte,
            comprados,
            vendidos,
            estoque,
          });
        });
      });
    });
  });
});

router.get('/admin/estoque/newMorte', adminAuth, async (req, res) => {
  const amountQ = await Morte.findOne({
    attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
    raw: true,
  });
  const morte = Number(amountQ["sum(`quantidade`)"]);

    //////////////////////vendidos
    const vendidos = await Venda.count();

    //////////////////////comprados
    const comprados = await Compra.count();

  const amountV = await Morte.findOne({
    attributes: [sequelize.fn("sum", sequelize.col("valor"))],
    raw: true,
  });
  const valorf = Number(amountV["sum(`valor`)"]);



  const amountU = await Compra.findOne({
    attributes: [
      [sequelize.fn("sum", sequelize.col("valor")), "total_valor_compras"],
    ],
    raw: true,
  });
  const TotalValorCompras = Number(amountU["total_valor_compras"]);

  const MediaCompraPonderada = ((TotalValorCompras - valorf) / (comprados - morte - vendidos)).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  
    Investidor.findAll().then((investidores) => {
      res.render('admin/estoque/newMorte', {
        investidores: investidores,
        MediaCompraPonderada,
      });
    });
  });

router.post('/morte/save',adminAuth,   (req, res) => {
    var data = req.body.data;
    var quantidade = req.body.quantidade;
    var valor = req.body.valor;
    var investidor = req.body.investidor;

     let valorFloat = parseFloat(
    valor.replace("R$", "").replace(".", "").replace(",", ".")
  );
  
     Morte.create(
     {
      data: data,
      quantidade: quantidade,
      valor: valorFloat,
      investidoreId: investidor,
    })
    .then(() => {
      res.redirect("/admin/estoque/morte");
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

    let valorFloat = parseFloat(
      valor.replace("R$", "").replace(".", "").replace(",", ".")
    );

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
