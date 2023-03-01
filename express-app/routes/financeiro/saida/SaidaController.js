const express = require("express");
const router = express.Router();
const slugify = require("slugify");
const sequelize = require("sequelize");
const { Op } = require("sequelize");

const Investidor = require("../../investidor/Investidor");
const Saida = require("./Saida");
const adminAuth = require("../../../middlewares/adminAuth");

//filtragem de dados, por peridodo que eles foram adicionados no BD
//formatar numeros em valores decimais (.toLocaleFixed(2))
Number.prototype.toLocaleFixed = function (n) {
  return this.toLocaleString(undefined, {
    minimumFractionDigits: n,
    maximumFractionDigits: n,
  });
};

router.get("/admin/saida", adminAuth, async (req, res, next) => {
  Saida.findAll({
    include: [
      {
        model: Investidor,
      },
    ],
    order: [["data", "DESC"]],
    raw: true,
    nest: true,
  }).then((saidas) => {
    Investidor.findAll().then(async (investidores) => {
      //////////////////////Capital Investidor
      var amountT = await Saida.findOne({
        attributes: [sequelize.fn("sum", sequelize.col("valor"))],

        raw: true,
      });
      var Total = Number(amountT["sum(`valor`)"]).toLocaleFixed(2);
      res.render("admin/financeiro/saida/index", {
        investidores: investidores,
        saidas: saidas,
        Total,
      });
    });
  });
});

router.get("/admin/saida/new", adminAuth, (req, res) => {
  Investidor.findAll().then((investidores) => {
    res.render("admin/financeiro/saida/new", {
      investidores: investidores,
    });
  });
});

router.post("/saida/save", adminAuth, (req, res) => {
  var data = req.body.data;
  var valor = req.body.valor;
  var obs = req.body.obs;
  var investidor = req.body.investidor;

  var valorFloat = valor.replace(".", "").replace(",", ".");

  Saida.create({
    data: data,
    valor: valorFloat,
    obs: obs,
    investidoreId: investidor,
  }).then(() => {
    res.redirect("/admin/saida");
  });
});

router.get("/admin/saida/edit/:id", adminAuth, (req, res) => {
  var id = req.params.id;

  Saida.findByPk(id)
    .then((saida) => {
      if (saida != undefined) {
        Investidor.findAll().then((investidores) => {
          res.render("admin/saida/edit", {
            saida: saida,
            investidores: investidores,
          });
        });
      } else {
        res.redirect("/admin/saida");
      }
    })
    .catch((err) => {
      res.redirect("/admin/saida");
    });
});

router.post("/saida/update", adminAuth, (req, res) => {
  var id = req.body.id;
  var data = req.body.data;
  var valor = req.body.valor;
  var obs = req.body.obs;
  var investidor = req.body.investidor;

  var valorFloat = valor.replace(".", "").replace(",", ".");

  Saida.update(
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
      res.redirect("/admin/saida");
    })
    .catch((err) => {
      res.send("erro:" + err);
    });
});

router.post("/saida/delete", adminAuth, (req, res) => {
  var id = req.body.id;
  if (id != undefined) {
    if (!isNaN(id)) {
      Saida.destroy({
        where: {
          id: id,
        },
      }).then(() => {
        res.redirect("/admin/saida");
      });
    } else {
      // NÃO FOR UM NÚMERO
      res.redirect("/admin/saida");
    }
  } else {
    // NULL
    res.redirect("/admin/saida");
  }
});

module.exports = router;
