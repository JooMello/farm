const express = require("express");
const router = express.Router();
const sequelize = require("sequelize");
const Investidor = require("../../investidor/Investidor");
const adminAuth = require("../../../middlewares/adminAuth");
const moment = require('moment');
const Compra = require('../../compra/Compra');
const Historico = require("../../historico/Historico");
const Venda = require("../../venda/Venda");
const Morte = require("../../estoque/Estoque")
const ContaCorrente = require("../contaCorrente/ContaCorrente");

//filtragem de dados, por peridodo que eles foram adicionados no BD
//formatar numeros em valores decimais (.toLocaleFixed(2))
Number.prototype.toLocaleFixed = function (n) {
  return this.toLocaleString(undefined, {
    minimumFractionDigits: n,
    maximumFractionDigits: n,
  });
};

router.get("/admin/contaCorrente", adminAuth, async (req, res, next) => {
  Investidor.findAll({
    raw: true,
    nest: true,
  }).then(async (investidores) => {
     ContaCorrente.findAll({
       include: [
         {
           model: Investidor,
         },
       ],
       order: [["data", "DESC"]],
       raw: true,
       nest: true,
     }).then(async (contaCorrente) => {
             //////////////////////Capital Investidor
       Compra.findAll({
         include: [
           {
             model: Investidor,
           },
         ],
         attributes: [
           "data",
           "code",
           "quantidade",
           [sequelize.fn("SUM", sequelize.col("valor")), "total_valor"],
           "dolar",
           [sequelize.fn("SUM", sequelize.col("amount")), "total_amount"],
           "obs",
           "investidoreId",
         ],
         group: ["data", "code", "quantidade", "dolar", "obs", "investidoreId"],
         order: [["data", "DESC"]],
         raw: true,
         nest: true,
       }).then(async (compras) => {
         compras.forEach((compra) => {
           compra.data = moment(compra.data).format("DD/MM/YYYY");
         });
         Venda.findAll({
           include: [
             {
               model: Investidor,
             },
           ],
           attributes: [
             "data",
             "code",
             "quantidade",
             [sequelize.fn("SUM", sequelize.col("valor")), "total_valor"],
             "dolar",
             [sequelize.fn("SUM", sequelize.col("amount")), "total_amount"],
             "obs",
             "investidoreId",
           ],
           group: [
             "data",
             "code",
             "quantidade",
             "dolar",
             "obs",
             "investidoreId",
           ],
           order: [["data", "DESC"]],
           raw: true,
           nest: true,
         }).then(async (vendas) => {
          vendas.forEach((venda) => {
            venda.data = moment(venda.data).format("DD/MM/YYYY");
            venda.total_valor = (venda.total_valor) / 2
          });
           contaCorrente.forEach((contaCorrente) => {
             contaCorrente.data = moment(contaCorrente.data).format(
               "DD/MM/YYYY"
             );
           });
    
           const amountC = await Compra.findOne({
            attributes: [sequelize.fn("sum", sequelize.col("valor"))],
            raw: true,
          });
          const amountCompraV = Number(amountC["sum(`valor`)"]);

          const amountCompra = Number(amountC["sum(`valor`)"]).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });

          Venda.count().then(async (totalVendas) => {
            console.log(totalVendas)
          const contaCorrentes = await ContaCorrente.findAll({
            where: {
              obs: "Crédito referente a venda de gado",
            },
            attributes: ['valor']
          });

          let totalVendaSum = 0;
          contaCorrentes.forEach(contaCorrente => {
            totalVendaSum += parseFloat(contaCorrente.valor);
          });

          const contaCorrentesEntrada = await ContaCorrente.findAll({
            where: {
              category: "ENTRADA",
            },
            attributes: ['valor']
          });

          let totalSumEntrada = 0;
          contaCorrentesEntrada.forEach(contaCorrentesEntrada => {
            totalSumEntrada += parseFloat(contaCorrentesEntrada.valor);
          });

          const contaCorrentesRetirada = await ContaCorrente.findAll({
            where: {
              category: "RETIRADA",
            },
            attributes: ['valor']
          });

          let totalSumRetirada = 0;
          contaCorrentesRetirada.forEach(contaCorrentesRetirada => {
            totalSumRetirada += parseFloat(contaCorrentesRetirada.valor);
          });

          const mortes = await Morte.findAll({
            attributes: ['valor'],
           raw: true,
          });
        
          let sumMortes = 0;
          mortes.forEach(morte => {
            sumMortes += parseFloat(morte.valor);
          });
          console.log(amountCompraV)
console.log(totalVendaSum)
console.log(sumMortes)
console.log(totalSumEntrada)
console.log(totalSumRetirada)
          
const Total = (((totalSumEntrada - amountCompraV) + totalVendaSum) - totalSumRetirada);
           res.render("admin/financeiro/contaCorrente/index", {
             compras: compras,
             vendas: vendas,
             investidores: investidores,
             contaCorrente: contaCorrente,
             Total,amountCompra,totalVendaSum, 
           });
         });
       });
      })
     });
       });
     });

router.get("/admin/contaCorrente/new", adminAuth, (req, res) => {
  Investidor.findAll().then((investidores) => {
    res.render("admin/financeiro/contaCorrente/new", {
      investidores: investidores,
    });
  });
});

router.post("/contaCorrente/save", adminAuth, async (req, res) => {
  const data = req.body.data;
  const category = req.body.category;
  const valor = req.body.valor;
  const obs = req.body.obs;
  const investidor = req.body.investidor;
  const code = req.body.code;

  const valorFloat = valor.replace(".", "").replace(",", ".");

  ContaCorrente.create({
    data: data,
    category: category,
    valor: valorFloat,
    code: code,
    obs: obs,
    investidoreId: investidor,
  }).then(() => {
    res.redirect("/admin/contaCorrente");
  });
});

router.get("/admin/contaCorrente/edit/:id", adminAuth, (req, res) => {
  const id = req.params.id;

  ContaCorrente.findByPk(id)
    .then((contaCorrente) => {
      if (contaCorrente != undefined) {
        Investidor.findAll().then((investidores) => {
          res.render("admin/financeiro/contaCorrente/edit", {
            contaCorrente: contaCorrente,
            investidores: investidores,
          });
        });
      } else {
        res.redirect("/admin/contaCorrente");
      }
    })
    .catch((err) => {
      res.redirect("/admin/contaCorrente");
    });
});

router.post("/contaCorrente/update", adminAuth, (req, res) => {
  const id = req.body.id;
  const data = req.body.data;
  const category = req.body.category;
  const valor = req.body.valor;
  const obs = req.body.obs;
  const investidor = req.body.investidor;

  const valorFloat = valor.replace(".", "").replace(",", ".");

  ContaCorrente.update(
    {
      data: data,
      category: category,
      valor: valorFloat,
      obs: obs,
      investidoreId: investidor,
    },
    {
      where: {
        id: id,
      },
    }
  )
    .then(() => {
      res.redirect("/admin/contaCorrente");
    })
    .catch((err) => {
      res.send("erro:" + err);
    });
});

router.post("/contaCorrente/delete", adminAuth, (req, res) => {
  const id = req.body.id;
  const code = req.body.code;
  console.log(id)
  console.log(code)
  if (id != undefined) {
    if (!isNaN(id)) {
      ContaCorrente.destroy({
        where: {
          id: id,
        },
      }).then(() => {
        Historico.destroy({
          where: {
            code: code,
          },
        }).then(() => {
      Compra.destroy({
        where: {
          code: code,
        },
      }).then(() => {
        Venda.destroy({
          where: {
            code: code,
          },
        }).then(() => {
        res.redirect("/admin/contaCorrente");
      });
    });
  });
});
    } else {
      // NÃO FOR UM NÚMERO
      res.redirect("/admin/contaCorrente");
    }
  } else {
    // NULL
    res.redirect("/admin/contaCorrente");
  }
});

module.exports = router;
