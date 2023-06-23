const express = require("express");
const router = express.Router();
const Venda = require("./Venda");
const slugify = require("slugify");
const sequelize = require("sequelize");
const { Op } = require("sequelize");
const request = require("request");
const adminAuth = require("../../middlewares/adminAuth");
var fs = require("fs");
const moment = require("moment");

const Investidor = require("../investidor/Investidor");

const accountSid = "AC00fbbfc768402c07243ec830f4e3c2d8";
const authToken = "c49b7d7775ef24875c1a6e330bfc1c16";
const client = require("twilio")(accountSid, authToken);

const { host, port, user, pass } = require("../../config/mail.json");

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

router.get("/admin/venda", adminAuth, async (req, res, next) => {
  Venda.findAll({
    include: [
      {
        model: Investidor,
      },
    ],
    order: [["data", "DESC"]],
    raw: true,
    nest: true,
  }).then((vendas) => {
    vendas.forEach((venda) => {
      venda.data = moment(venda.data).format("DD/MM/YYYY");
    });
    Investidor.findAll().then(async (investidores) => {
      //////////////////////Quantidade
      var quantidade = await Venda.count();

      //////////////////////valor Venda
      var amountT = await Venda.findOne({
        attributes: [sequelize.fn("sum", sequelize.col("valor"))],

        raw: true,
      });
      var ValorVenda = Number(amountT["sum(`valor`)"]).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });

      //////////////////////valor Venda em dolar
      var amountD = await Venda.findOne({
        attributes: [sequelize.fn("sum", sequelize.col("amount"))],

        raw: true,
      });
      var TotalVendaDolar = Number(amountD["sum(`amount`)"]).toLocaleString(
        "pt-BR",
        { style: "currency", currency: "BRL" }
      );

      var amountU = await Venda.findOne({
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

      var mediaVenda = Number(amountU["media"]).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });

      res.render("admin/venda/index", {
        vendas: vendas,
        investidores: investidores,
        mediaVenda,
        quantidade,
        ValorVenda,
        TotalVendaDolar,
      });
    });
  });
});

router.get("/admin/venda/new", adminAuth, (req, res) => {
  var cotacaoDolar = Number(cotacao).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  Investidor.findAll().then((investidores) => {
    res.render("admin/venda/new", {
      investidores: investidores,
      cotacao: cotacao,
      cotacaoDolar: cotacaoDolar,
    });
  });
});

router.post("/venda/save", adminAuth, async (req, res) => {
  let id = req.body.id;
  let code = req.body.code;
  let brinco = req.body.brinco;
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
  let amountFloat = parseFloat(amount.replace("$", "").replace(",", ""));

  let nextBrinco = null;
  let nextCode;

  if (brinco === undefined || brinco === "") {
    try {
      const lastVenda = await Venda.findOne({
        order: [["brinco", "DESC"]],
        limit: 1,
      });

      if (cccccccc) {
        const lastBrinco = lastVenda.brinco;
        if (typeof lastBrinco === "number") {
          nextBrinco = lastBrinco + 1;
        } else {
          nextBrinco = null;
        }
      } else {
        nextBrinco = null;
      }
    } catch (error) {
      // Tratar o erro de consulta
      console.error(error);
      nextBrinco = null;
    }
  } else {
    nextBrinco = parseInt(brinco);
  }

  if (nextBrinco !== null) {
    try {
      const existingVenda = await Venda.findOne({
        where: {
          brinco: nextBrinco,
        },
      });

      if (existingVenda) {
        // Registro com o mesmo valor de brinco já existe
        return res.send(
          '<script>alert("Registro com o mesmo valor de brinco já existe"); window.location.href = "/admin/venda/new";</script>'
        );
      }
    } catch (error) {
      // Tratar o erro de consulta
      console.error(error);
      return res
        .status(500)
        .json({ error: "Erro ao verificar o valor de brinco" });
    }
  }

  if (!code) {
    try {
      const lastVenda = await Venda.findOne({
        order: [["code", "DESC"]],
        limit: 1,
      });

      if (lastVenda) {
        const lastCode = lastVenda.code.toString();
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
  insertVenda(nextBrinco, nextCode);

  function insertVenda(nextId, nextCode) {
    var objects = [];

    for (var i = 0; i < quantidade; i++) {
      objects.push({
        id: id,
        data: data,
        quantidade: quantidade,
        code: nextCode,
        brinco: nextBrinco,
        valor: valorFloat / quantidade,
        dolar: dolarFloat,
        amount: amountFloat / quantidade,
        obs: obs,
        investidoreId: investidor,
      });
      if (nextBrinco !== null) {
        nextBrinco++; // Incrementar o ID para o próximo objeto, apenas se brinco não for nulo
      }
    }

    Venda.bulkCreate(objects).then(() => {
      res.redirect("/admin/venda");
    });
  }
});

router.get("/admin/venda/edit/:id", adminAuth, (req, res) => {
  var id = req.params.id;

  Venda.findByPk(id)
    .then((venda) => {
      if (venda != undefined) {
        Investidor.findAll().then((investidores) => {
          res.render("admin/venda/edit", {
            venda: venda,
            investidores: investidores,
          });
        });
      } else {
        res.redirect("/admin/venda");
      }
    })
    .catch((err) => {
      res.redirect("/admin/venda");
    });
});

router.post("/venda/update", adminAuth, (req, res) => {
  var id = req.body.id;
  var data = req.body.data;
  var quantidade = req.body.quantidade;
  var valor = req.body.valor;
  var dolar = req.body.dolar;
  var amount = req.body.amount;
  var obs = req.body.obs;
  var investidor = req.body.investidor;

  let valorFloat = parseFloat(
    valor.replace("R$", "").replace(".", "").replace(",", ".")
  );
  let dolarFloat = parseFloat(dolar.replace("$", ""));
  let amountFloat = parseFloat(amount.replace("$", "").replace(",", "."));

  Venda.update(
    {
      data: data,
      quantidade: quantidade,
      valor: valorFloat,
      dolar: dolarFloat,
      amount: amountFloat,
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
      res.redirect("/admin/venda");
    })
    .catch((err) => {
      res.send("erro:" + err);
    });
});

router.post("/venda/delete", adminAuth, (req, res) => {
  var id = req.body.id;
  if (id != undefined) {
    if (!isNaN(id)) {
      Venda.destroy({
        where: {
          id: id,
        },
      }).then(() => {
        res.redirect("/admin/venda");
      });
    }
  } else {
    // NULL
    res.redirect("/admin/venda");
  }
});

module.exports = router;
