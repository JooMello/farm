const express = require("express");
const router = express.Router();
const app = express();
const sequelize = require("sequelize");
const Investidor = require("../../investidor/Investidor");
const adminAuth = require("../../../middlewares/adminAuth");

const Entrada = require("../entrada/Entrada");
const Saida = require("../saida/Saida");
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
      var amountT = await ContaCorrente.findOne({
        attributes: [sequelize.fn("sum", sequelize.col("valor"))],
        raw: true,
      });
      var Total = Number(amountT["sum(`valor`)"]).toLocaleFixed(2);
           res.render("admin/financeiro/contaCorrente/index", {
             investidores: investidores,
             contaCorrente: contaCorrente,
             Total,
           });
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

router.post("/contaCorrente/save", adminAuth, (req, res) => {
  var data = req.body.data;
  var category = req.body.category;
  var valor = req.body.valor;
  var obs = req.body.obs;
  var investidor = req.body.investidor;

  var valorFloat = valor.replace(".", "").replace(",", ".");

  ContaCorrente.create({
    data: data,
    category: category,
    valor: valorFloat,
    obs: obs,
    investidoreId: investidor,
  }).then(() => {
    res.redirect("/admin/contaCorrente");
  });
});

router.get("/admin/contaCorrente/edit/:id", adminAuth, (req, res) => {
  var id = req.params.id;

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
  var id = req.body.id;
  var data = req.body.data;
  var category = req.body.category;
  var valor = req.body.valor;
  var obs = req.body.obs;
  var investidor = req.body.investidor;

  var valorFloat = valor.replace(".", "").replace(",", ".");

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
  var id = req.body.id;
  if (id != undefined) {
    if (!isNaN(id)) {
      ContaCorrente.destroy({
        where: {
          id: id,
        },
      }).then(() => {
        res.redirect("/admin/contaCorrente");
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

app.get("/contaCorrente/:id", adminAuth, async (req, res, next) => {
  var id = req.params.id;
     ContaCorrente.findAll({
       include: [
         {
           model: Investidor,
         },
       ],
       where: {
        investidoreId: id,
      },
       order: [["data", "DESC"]],
       raw: true,
       nest: true,
     }).then(async (contaCorrente) => {
      Investidor.findAll().then(async (investidores) => {

      var amountT = await ContaCorrente.findOne({
        attributes: [sequelize.fn("sum", sequelize.col("valor"))],
        where: {
          investidoreId: id,
        },
        raw: true,
      });
      var Total = Number(amountT["sum(`valor`)"]).toLocaleFixed(2);
      
           res.render("admin/financeiro/contaCorrente/index", {
             investidores: investidores,
             contaCorrente: contaCorrente,
             Total,
           });
         });
       });
});

module.exports = router;
