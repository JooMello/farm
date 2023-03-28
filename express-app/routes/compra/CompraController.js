const express = require("express");
const router = express.Router();
const Compra = require("./Compra");
const slugify = require("slugify");
const sequelize = require("sequelize");
const { Op } = require("sequelize");
const request = require("request");

const moment = require('moment');
const adminAuth = require("../../middlewares/adminAuth");

const Investidor = require("../investidor/Investidor");

//filtragem de dados, por peridodo que eles foram adicionados no BD
//formatar numeros em valores decimais (.toLocaleFixed(2))
Number.prototype.toLocaleFixed = function (n) {
  return this.toLocaleString(undefined, {
    minimumFractionDigits: n,
    maximumFractionDigits: n,
  });
};

// https://docs.awesomeapi.com.br/

const moedas = "USD-BRL";

// request{options, callback}

const options = {
  url: `https://economia.awesomeapi.com.br/last/${moedas}`,
  method: "GET",
  headers: {
    Accept: "application/json",
    "Accept-Charset": "utf-8",
  },
};

const callback_dolar = function (erro, res, body) {
  let json = JSON.parse(body);
  cotacao = json.USDBRL["bid"];
};
const Dolar = request(options, callback_dolar);

router.get("/admin/compra", adminAuth, async (req, res, next) => {
  Compra.findAll({
    include: [
      {
        model: Investidor,
      },
    ],
    order: [["data", "DESC"]],
    raw: true,
    nest: true,
  }).then((compras) => {
    compras.forEach((compra) => {
      compra.data = moment(compra.data).format('DD/MM/YYYY');
    });
    Investidor.findAll().then(async (investidores) => {
      //////////////////////Quantidade
      var amountQ = await Compra.findOne({
        attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],

        raw: true,
      });
      var quantidade = Number(amountQ["sum(`quantidade`)"]);

      //////////////////////Capital Investidor
      var amountT = await Compra.findOne({
        attributes: [sequelize.fn("sum", sequelize.col("valor"))],

        raw: true,
      });
      var CapitalInvestido = Number(amountT["sum(`valor`)"]).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

      //////////////////////Capital Investidor em dolar
      var amountD = await Compra.findOne({
        attributes: [sequelize.fn("sum", sequelize.col("amount"))],

        raw: true,
      });
      var CapitalInvestidoDolar = Number(
        amountD["sum(`amount`)"]
      ).toLocaleString("en-US", { style: "currency", currency: "USD" });

                  var amountU = await Compra.findOne({
                    attributes: [
                      [
                        sequelize.fn(
                          "avg",
                          sequelize.fn("DISTINCT", sequelize.col("valor"))
                        ),
                        "media",
                      ],
                    ],
                    distinct: true,
                    raw: true,
                  });
                  var mediaCompra = Number(amountU["media"]).toLocaleString(
                    "pt-BR",
                    { style: "currency", currency: "BRL" }
                  );

      res.render("admin/compra/index", {
        compras: compras,
        investidores: investidores,
        quantidade ,mediaCompra,
        CapitalInvestido,
        CapitalInvestidoDolar,
      });
    });
  });
});

router.get("/admin/compra/new", adminAuth, (req, res) => {

  var cotacaoDolar = Number(cotacao).toLocaleString('en-US', {style: 'currency', currency: 'USD'});

  Investidor.findAll().then((investidores) => {
    res.render("admin/compra/new", {
      investidores: investidores,
      cotacao: cotacao,
      cotacaoDolar: cotacaoDolar,
    });
  });
});

router.post("/compra/save", adminAuth, (req, res) => {
  var id = req.body.id;
  var data = req.body.data;
  var quantidade = req.body.quantidade;
  var valor = req.body.valor;
  var dolar = req.body.dolar;
  var amount = req.body.amount;
  var obs = req.body.obs;
  var investidor = req.body.investidor;

  var valorFloat = valor.replace(".", "").replace(",", ".");
  var amountFloat = amount.replace("$", "");

  Compra.create({
    id: id,
    data: data,
    quantidade: quantidade,
    valor: valorFloat,
    dolar: dolar,
    amount: amountFloat,
    obs: obs,
    investidoreId: investidor,
  }).then(() => {
    res.redirect("/admin/compra");
  });
});

router.get("/admin/compra/edit/:id", adminAuth, (req, res) => {
  var id = req.params.id;

  Compra.findByPk(id)
    .then((compra) => {
      if (compra != undefined) {
        Investidor.findAll().then((investidores) => {
          res.render("admin/compra/edit", {
            compra: compra,
            investidores: investidores,
          });
        });
      } else {
        res.redirect("/admin/compra");
      }
    })
    .catch((err) => {
      res.redirect("/admin/compra");
    });
});

router.post("/compra/update", adminAuth, (req, res) => {
  var id = req.body.id;
  var data = req.body.data;
  var quantidade = req.body.quantidade;
  var valor = req.body.valor;
  var dolar = req.body.dolar;
  var amount = req.body.amount;
  var obs = req.body.obs;
  var investidor = req.body.investidor;

  var valorFloat = valor.replace(".", "").replace(",", ".");

  Compra.update(
    {
      data: data,
      quantidade: quantidade,
      valor: valorFloat,
      dolar: dolar,
      amount: amount,
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
      res.redirect("/admin/compra");
    })
    .catch((err) => {
      res.send("erro:" + err);
    });
});

router.post("/compra/delete", adminAuth, (req, res) => {
  var id = req.body.id;
  if (id != undefined) {
    if (!isNaN(id)) {
      Compra.destroy({
        where: {
          id: id,
        },
      }).then(() => {
        res.redirect("/admin/compra");
      });
    } else {
      // NÃO FOR UM NÚMERO
      res.redirect("/admin/compra");
    }
  } else {
    // NULL
    res.redirect("/admin/compra");
  }
});

module.exports = router;
