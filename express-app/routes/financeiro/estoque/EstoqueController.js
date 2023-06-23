const express = require("express");
const router = express.Router();
const sequelize = require("sequelize");
const Investidor = require("../../investidor/Investidor");
const adminAuth = require("../../../middlewares/adminAuth");

const Estoque = require("../estoque/Estoque");

//filtragem de dados, por peridodo que eles foram adicionados no BD
//formatar numeros em valores decimais (.toLocaleFixed(2))
Number.prototype.toLocaleFixed = function (n) {
  return this.toLocaleString(undefined, {
    minimumFractionDigits: n,
    maximumFractionDigits: n,
  });
};

router.get("/admin/estoque", adminAuth, async (req, res, next) => {
  Investidor.findAll({
    raw: true,
    nest: true,
  }).then(async (investidores) => {
    Estoque.findAll({
       include: [
         {
           model: Investidor,
         },
       ],
       order: [["data", "DESC"]],
       raw: true,
       nest: true,
     }).then(async (estoque) => {
      var amountT = await Estoque.findOne({
        attributes: [sequelize.fn("sum", sequelize.col("valor"))],
        raw: true,
      });
      var Total = Number(amountT["sum(`valor`)"]).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
           res.render("admin/financeiro/estoque/index", {
             investidores: investidores,
             estoque: estoque,
             Total,
           });
         });
       });
});

router.get("/admin/estoque/new", adminAuth, (req, res) => {
  Investidor.findAll().then((investidores) => {
    res.render("admin/financeiro/estoque/new", {
      investidores: investidores,
    });
  });
});

router.post("/estoque/save", adminAuth, (req, res) => {
  var data = req.body.data;
  var category = req.body.category;
  var valor = req.body.valor;
  var obs = req.body.obs;
  var investidor = req.body.investidor;

  let valorFloat = parseFloat(
    valor.replace("R$", "").replace(".", "").replace(",", ".")
  );

  Estoque.create({
    data: data,
    category: category,
    valor: valorFloat,
    obs: obs,
    investidoreId: investidor,
  }).then(() => {
    res.redirect("/admin/estoque");
  });
});

router.get("/admin/estoque/edit/:id", adminAuth, (req, res) => {
  var id = req.params.id;

  Estoque.findByPk(id)
    .then((estoque) => {
      if (estoque != undefined) {
        Investidor.findAll().then((investidores) => {
          res.render("admin/financeiro/contaCorrente/edit", {
            estoque: estoque,
            investidores: investidores,
          });
        });
      } else {
        res.redirect("/admin/estoque");
      }
    })
    .catch((err) => {
      res.redirect("/admin/estoque");
    });
});

router.post("/estoque/update", adminAuth, (req, res) => {
  var id = req.body.id;
  var data = req.body.data;
  var category = req.body.category;
  var valor = req.body.valor;
  var obs = req.body.obs;
  var investidor = req.body.investidor;

  let valorFloat = parseFloat(
    valor.replace("R$", "").replace(".", "").replace(",", ".")
  );

  Estoque.update(
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
      res.redirect("/admin/estoque");
    })
    .catch((err) => {
      res.send("erro:" + err);
    });
});

router.post("/estoque/delete", adminAuth, (req, res) => {
  var id = req.body.id;
  if (id != undefined) {
    if (!isNaN(id)) {
      Estoque.destroy({
        where: {
          id: id,
        },
      }).then(() => {
        res.redirect("/admin/estoque");
      });
    } else {
      // NÃO FOR UM NÚMERO
      res.redirect("/admin/estoque");
    }
  } else {
    // NULL
    res.redirect("/admin/estoque");
  }
});

module.exports = router;
