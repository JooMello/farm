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

  var amountCompra = await Compra.findOne({
    attributes: [sequelize.fn("sum", sequelize.col("valor"))],
    where: {
      status: "Em estoque",
    },
    raw: true,
  });
  
  var valorCompraTotal = Number(amountCompra["sum(`valor`)"]);

    //////////////////////comprados
    var compradosTotal = await Compra.count();


  var comprados = await Compra.count({
    where: {
      status: "Em estoque",
    },
  });
  

  //////////////////////vendidos
  var vendidos = await Venda.count();

  //////////////////////estoque
  var estoque = compradosTotal - morte - vendidos;

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
           var TotalCompra = Number(amountC["sum(`valor`)"]);
           var TotalV = Number(amountV["sum(`valor`)"]) /2;
           const Totalf = (TotalCompra - TotalV);
          var Total = Totalf.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });

          var TotalC = TotalCompra.toLocaleString("pt-BR", {
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
      
          var MediaCompraPonderada = (valorCompraTotal  / (comprados)).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });

              
  console.log(valorCompraTotal)
  console.log(comprados)
  console.log(valorCompraTotal * comprados)
  console.log(MediaCompraPonderada)


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
            compradosTotal,
            vendidos,
            estoque,
            TotalC,
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

    var comprados = await Compra.count({
      where: {
        status: "Em estoque",
      },
    });

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
  var amountCompra = await Compra.findOne({
    attributes: [sequelize.fn("sum", sequelize.col("valor"))],
    where: {
      status: "Em estoque",
    },
    raw: true,
  });
  
  var valorCompraTotal = Number(amountCompra["sum(`valor`)"]);

  var MediaCompraPonderada = (valorCompraTotal  / (comprados)).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  Compra.findAll({
    where: {
      status: "Em estoque",
    }
  }).then((compras) => {
    Investidor.findAll().then((investidores) => {
      res.render('admin/estoque/newMorte', {
        compras: compras,
        investidores: investidores,
        MediaCompraPonderada,
      });
    });
  });
  });

router.post('/morte/save',adminAuth, async  (req, res) => {
    var data = req.body.data;
    var quantidade = req.body.quantidade;
    var valor = req.body.valor;
    var brinco = req.body.brinco;
    var peso = req.body.peso;
    var investidor = req.body.investidor;

     let valorFloat = parseFloat(
    valor.replace("R$", "").replace(".", "").replace(",", ".")
  );

  try {
  const objects = [];

  for (let i = 0; i < quantidade; i++) {
  
    objects.push({
      data: data,
      quantidade: 1,
      valor: valorFloat,
      brinco: brinco[i],
      peso: peso[i],
      investidoreId: investidor,
    });

    Compra.update(
      {
        status:"Morto"
      },
      {
        where: {
          brinco: brinco[i],
        },
      }
    )

}
  
await Morte.bulkCreate(objects)
      res.redirect("/admin/estoque/morte");
    }
    catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao salvar os registros no banco de dados" });
    }
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
