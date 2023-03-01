const express = require("express");
const router = express.Router();
const Investidor = require("../../investidor/Investidor");
const slugify = require("slugify");
const sequelize = require("sequelize");
const adminAuth = require("../../../middlewares/adminAuth");
const { Op } = require("sequelize");

const Entrada = require("./Entrada");
const DebitoCredito = require("../debitoCredito/DebitoCredito");

var app = express();

//filtragem de dados, por peridodo que eles foram adicionados no BD
//formatar numeros em valores decimais (.toLocaleFixed(2))
Number.prototype.toLocaleFixed = function (n) {
  return this.toLocaleString(undefined, {
    minimumFractionDigits: n,
    maximumFractionDigits: n,
  });
};

router.get("/admin/entrada", adminAuth, async (req, res, next) => {
  Entrada.findAll({
    include: [
      {
        model: Investidor,
      },
    ],
    order: [["data", "DESC"]],
    raw: true,
    nest: true,
  }).then((entradas) => {
    Investidor.findAll().then(async (investidores) => {
      //////////////////////Capital Investidor
      res.render("admin/entrada/index", {
        investidores: investidores,
      });
    });
  });
});

router.get("/admin/entrada/new", adminAuth, (req, res) => {
  Investidor.findAll().then((investidores) => {
    res.render("admin/entrada/new", {
      investidores: investidores,
    });
  });
});

router.post("/entrada/save", adminAuth, (req, res) => {
  var data = req.body.data;
  var valor = req.body.valor;
  var obs = req.body.obs;
  var investidor = req.body.investidor;

  var valorFloat = valor.replace(".", "").replace(",", ".");

  Entrada.create({
    data: data,
    valor: valorFloat,
    obs: obs,
    investidoreId: investidor,
  }).then(() => {
    res.redirect("/admin/entrada");
  });
});

router.get("/admin/entrada/edit/:id", adminAuth, (req, res) => {
  var id = req.params.id;

  Entrada.findByPk(id)
    .then((entrada) => {
      if (entrada != undefined) {
        Investidor.findAll().then((investidores) => {
          res.render("admin/entrada/edit", {
            entrada: entrada,
            investidores: investidores,
          });
        });
      } else {
        res.redirect("/admin/entrada");
      }
    })
    .catch((err) => {
      res.redirect("/admin/entrada");
    });
});

router.post("/entrada/update", adminAuth, (req, res) => {
  var id = req.body.id;
  var data = req.body.data;
  var valor = req.body.valor;
  var obs = req.body.obs;
  var investidor = req.body.investidor;

  var valorFloat = valor.replace(".", "").replace(",", ".");

  Entrada.update(
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
      res.redirect("/admin/entrada");
    })
    .catch((err) => {
      res.send("erro:" + err);
    });
});

router.post("/entrada/delete", adminAuth, (req, res) => {
  var id = req.body.id;
  if (id != undefined) {
    if (!isNaN(id)) {
      Entrada.destroy({
        where: {
          id: id,
        },
      }).then(() => {
        res.redirect("/admin/entrada");
      });
    } else {
      // NÃO FOR UM NÚMERO
      res.redirect("/admin/entrada");
    }
  } else {
    // NULL
    res.redirect("/admin/entrada");
  }
});

module.exports = router;
