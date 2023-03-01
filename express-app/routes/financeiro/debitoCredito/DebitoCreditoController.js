const express = require("express");
const router = express.Router();
const slugify = require("slugify");
const sequelize = require("sequelize");
const { Op } = require("sequelize");

const Investidor = require("../../investidor/Investidor");
const Compra = require("../../compra/Compra");
const Venda = require("../../venda/Venda");
const DebitoCredito = require("./DebitoCredito");
const adminAuth = require("../../../middlewares/adminAuth");

//filtragem de dados, por peridodo que eles foram adicionados no BD
//formatar numeros em valores decimais (.toLocaleFixed(2))
Number.prototype.toLocaleFixed = function (n) {
  return this.toLocaleString(undefined, {
    minimumFractionDigits: n,
    maximumFractionDigits: n,
  });
};

router.get("/admin/debitoCredito", adminAuth, async (req, res, next) => {
  DebitoCredito.findAll({
    include: [
      {
        model: Investidor,
      },
    ],
    order: [["data", "DESC"]],
    raw: true,
    nest: true,
  }).then((debitoCreditos) => {
    Investidor.findAll().then(async (investidores) => {
      //////////////////////Capital Investidor
      var amountT = await DebitoCredito.findOne({
        attributes: [sequelize.fn("sum", sequelize.col("valor"))],

        raw: true,
      });
      var Total = Number(amountT["sum(`valor`)"]).toLocaleFixed(2);

      res.render("admin/financeiro/debitoCredito/index", {
        debitoCreditos: debitoCreditos,
        investidores: investidores,
        Total,
      });
    });
  });
});

router.get("/admin/debitoCredito/new", adminAuth, (req, res) => {
  Investidor.findAll().then((investidores) => {
    res.render("admin/financeiro/debitoCredito/new", {
      investidores: investidores,
    });
  });
});

router.post("/debitoCredito/save", adminAuth, (req, res) => {
  var data = req.body.data;
  var valor = req.body.valor;
  var obs = req.body.obs;
  var investidor = req.body.investidor;

  var valorFloat = valor.replace(".", "").replace(",", ".");

  DebitoCredito.create({
    data: data,
    valor: valorFloat,
    obs: obs,
    investidoreId: investidor,
  }).then(() => {
    res.redirect("/admin/financeiro/debitoCredito");
  });
});

router.get("/admin/debitoCredito/edit/:id", adminAuth, (req, res) => {
  var id = req.params.id;

  DebitoCredito.findByPk(id)
    .then((debitoCredito) => {
      if (debitoCredito != undefined) {
        Investidor.findAll().then((investidores) => {
          res.render("admin/debitoCredito/edit", {
            debitoCredito: debitoCredito,
            investidores: investidores,
          });
        });
      } else {
        res.redirect("/admin/financeiro/debitoCredito");
      }
    })
    .catch((err) => {
      res.redirect("/admin/financeiro/debitoCredito");
    });
});

router.post("/debitoCredito/update", adminAuth, (req, res) => {
  var id = req.body.id;
  var data = req.body.data;
  var valor = req.body.valor;
  var obs = req.body.obs;
  var investidor = req.body.investidor;

  var valorFloat = valor.replace(".", "").replace(",", ".");

  DebitoCredito.update(
    {
      data: data,
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
      res.redirect("/admin/financeiro/debitoCredito");
    })
    .catch((err) => {
      res.send("erro:" + err);
    });
});

router.post("/debitoCredito/delete", adminAuth, (req, res) => {
  var id = req.body.id;
  if (id != undefined) {
    if (!isNaN(id)) {
      DebitoCredito.destroy({
        where: {
          id: id,
        },
      }).then(() => {
        res.redirect("/admin/financeiro/debitoCredito");
      });
    } else {
      // NÃO FOR UM NÚMERO
      res.redirect("/admin/financeiro/debitoCredito");
    }
  } else {
    // NULL
    res.redirect("/admin/financeiro/debitoCredito");
  }
});

module.exports = router;
