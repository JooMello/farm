const express = require("express");
const router = express.Router();
const Compra = require("./Compra");
const slugify = require("slugify");
const sequelize = require("sequelize");
const { Op } = require("sequelize");
const request = require("request");

const moment = require("moment");
const adminAuth = require("../../middlewares/adminAuth");

const Investidor = require("../investidor/Investidor");

const accountSid = "AC00fbbfc768402c07243ec830f4e3c2d8";
const authToken = "a4bf781cce4033571b1cebd1bab79bd4";
const client = require("twilio")(accountSid, authToken);

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
      compra.data = moment(compra.data).format("DD/MM/YYYY");
    });
    Investidor.findAll().then(async (investidores) => {
      //////////////////////Quantidade
      var quantidade = await Compra.count();

      //////////////////////Capital Investidor
      var amountT = await Compra.findOne({
        attributes: [sequelize.fn("sum", sequelize.col("valor"))],

        raw: true,
      });
      var CapitalInvestido = Number(amountT["sum(`valor`)"]).toLocaleString(
        "pt-BR",
        {
          style: "currency",
          currency: "BRL",
        }
      );

      //////////////////////Capital Investidor em dolar
      var amountD = await Compra.findOne({
        attributes: [sequelize.fn("sum", sequelize.col("amount"))],

        raw: true,
      });
      var CapitalInvestidoDolar = Number(
        amountD["sum(`amount`)"]
      ).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      });

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
      var mediaCompra = Number(amountU["media"]).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
 console.log(compras);
      res.render("admin/compra/index", {
        compras: compras,
        investidores: investidores,
        quantidade,
        mediaCompra,
        CapitalInvestido,
        CapitalInvestidoDolar,
      });
    });
  });
});

router.get("/admin/compra/new", adminAuth, (req, res) => {
  var cotacaoDolar = Number(cotacao).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  Investidor.findAll().then((investidores) => {
    res.render("admin/compra/new", {
      investidores: investidores,
      cotacao: cotacao,
      cotacaoDolar: cotacaoDolar,
    });
  });
});

router.post("/compra/save", adminAuth, async (req, res) => {
  let id = req.body.id;
  let code = req.body.code;
  let data = req.body.data;
  let quantidade = req.body.quantidade;
  let valor = req.body.valor;
  let dolar = req.body.dolar;
  let amount = req.body.amount;
  let obs = req.body.obs;
  let investidor = req.body.investidor;

  let valorFloat = parseFloat(
    valor.replace("R$", "").replace(".", "").replace(",", ".")
  );
  let dolarFloat = parseFloat(dolar.replace("$", ""));
  let amountFloat = parseFloat(
    amount.replace("$", "").replace(",", ".").replace(".", "")
  );

  let nextId;
  let nextCode;

  if (!id) {
    try {
      const compra = await Compra.findOne({
        order: [["id", "DESC"]],
        limit: 1,
      });
      nextId = compra ? compra.id + 1 : 1;
    } catch (error) {
      // Tratar o erro de consulta
      console.error(error);
      nextId = 1;
    }
  } else {
    nextId = parseInt(id) + 1;
  }

  if (!code) {
    try {
      const lastCompra = await Compra.findOne({
        order: [["code", "DESC"]],
        limit: 1,
      });

      if (lastCompra) {
        const lastCode = lastCompra.code.toString();
        const incrementedCode = (parseInt(lastCode) + 1).toString();
        nextCode = parseInt(incrementedCode);
      } else {
        nextCode = 1;
      }
    } catch (error) {
      // Tratar o erro de consulta
      console.error(error);
      nextCode = 1;
    }
  } else {
    nextCode = parseInt(code); // Não incrementar o código fornecido
  }

  insertCompra(nextId, nextCode);

  function insertCompra(nextId, nextCode) {
    var objects = [];

    for (var i = 0; i < quantidade; i++) {
      objects.push({
        id: nextId,
        data: data,
        quantidade: quantidade,
        code: nextCode,
        valor: valorFloat / quantidade,
        dolar: dolarFloat,
        amount: amountFloat / quantidade,
        obs: obs,
        investidoreId: investidor,
      });
      nextId++; // Incrementar o ID para o próximo objeto
    }

    Compra.bulkCreate(objects).then(() => {
      res.redirect("/admin/compra");
    });
  }
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
