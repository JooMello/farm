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
const ContaCorrente = require("../financeiro/contaCorrente/ContaCorrente");
const Compra = require("../compra/Compra")
const Morte = require("../estoque/Estoque")


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


// Função para formatar um valor monetário (R$)
function formatCurrency(value) {
  const formattedValue = parseFloat(value.replace("R$", "").replace(".", "").replace(",", "."));
  return isNaN(formattedValue) ? 0 : formattedValue;
}

// Função para formatar um valor em dólar ($)
function formatDollar(value) {
  const formattedValue = parseFloat(value.replace("$", "").replace(",", ""));
  return isNaN(formattedValue) ? 0 : formattedValue;
}

// Função para formatar um valor ou array de valores
function formatValueOrArray(value) {
  if (Array.isArray(value)) {
    return value.map(val => formatCurrency(val));
  } else {
    return formatCurrency(value);
  }
}

router.get("/admin/venda", adminAuth, async (req, res, next) => {
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
    group: ["data", "code", "quantidade", "dolar", "obs", "investidoreId"],
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

router.get("/admin/venda/view/:code", adminAuth, async (req, res, next) => {

  const code = req.params.code;

  Venda.findAll({
    where: {
      code: code,
    },
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
      var quantidadeVenda = await Venda.findOne({
        where: {
          code: code, // Condição para encontrar a venda específica
        },
        attributes: ['quantidade'], // Substitua 'quantidade' pelo nome correto do campo na tabela venda
        raw: true,
      });

      const quantidade = quantidadeVenda ? quantidadeVenda.quantidade : null;
      //////////////////////Capital Investidor
      var amountT = await Venda.findOne({
        where: {
          code: code,
        },
        attributes: [sequelize.fn("sum", sequelize.col("valor"))],

        raw: true,
      });
      var ValorVenda = Number(amountT["sum(`valor`)"]).toLocaleString(
        "pt-BR",
        {
          style: "currency",
          currency: "BRL",
        }
      );

      //////////////////////Capital Investidor em dolar
      var amountD = await Venda.findOne({
        where: {
          code: code,
        },
        attributes: [sequelize.fn("sum", sequelize.col("amount"))],

        raw: true,
      });
      var TotalVendaDolar = Number(
        amountD["sum(`amount`)"]
      ).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      });

      var amountU = await Venda.findOne({
        where: {
          code: code,
        },
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
 console.log(vendas);
      res.render("admin/venda/view", {
        vendas: vendas,
        investidores: investidores,
        quantidade,
        mediaVenda,
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
  let totalAmount = req.body.totalAmount;
  let peso = req.body.peso;
  let dolar = req.body.dolar;
  let amount = req.body.amount;
  let obs = req.body.obs;
  let investidor = req.body.investidor;

    // Formatando os valores
    const valorFloat = parseFloat(valor.replace("R$", "").replace(".", "").replace(",", "."));
    const totalAmountFloat = parseFloat(totalAmount.replace("R$", "").replace(".", "").replace(",", "."));
    const formattedPeso = formatValueOrArray(req.body.peso);
    const dolarFloat = parseFloat(dolar.replace("$", ""));
    const amountFloat = parseFloat(amount.replace("$", "").replace(",", ""));

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
    
  

      //////////////////////comprados
  var comprados = await Compra.count();

  //////////////////////vendidos
  var vendidos = await Venda.count();

  //////////////////////estoque
  var estoque = comprados - morte - vendidos;

    var amountU = await Compra.findOne({
      attributes: [
        [sequelize.fn("sum", sequelize.col("valor")), "total_valor_compras"],
      ],
      raw: true,
    });
    var TotalValorCompras = Number(amountU["total_valor_compras"]);
  
    var MediaCompraPonderada = ((TotalValorCompras - valorf) / (estoque))

    const valorCompra = (MediaCompraPonderada * quantidade) / 2;
    const valorReal = totalAmountFloat - valorCompra;
    console.log(MediaCompraPonderada)
    console.log(valorCompra)
    console.log(valorReal)

    try {
      const existingBrinco = await Venda.findOne({
        where: {
          brinco: brinco,
        },
      });
  
      // Encontrar o último brinco e código
      const lastVenda = await Venda.findOne({
        order: [["brinco", "DESC"]],
        limit: 1,
      });
  
      const lastCode = await Venda.findOne({
        order: [["code", "DESC"]],
        limit: 1,
      });
  
  const nextCode = lastCode ? parseInt(lastCode.code) + 1 : 1;
  
      const objects = [];
  
      for (let i = 0; i < quantidade; i++) {
        objects.push({
          id: id,
          data: data,
          brinco: brinco[i],
          quantidade: quantidade,
          code: nextCode,
          valor: valorFloat,
          totalAmount: totalAmountFloat,
          peso: formattedPeso[i],
          dolar: dolarFloat,
          amount: amountFloat,
          obs: obs,
          investidoreId: investidor,
        });
      }
  
      // Inserir os registros no banco de dados
      await Venda.bulkCreate(objects);
      ContaCorrente.create({
        data: data,
        category: 'CREDITO',
        valor: totalAmountFloat,
        obs: 'Crédito referente a venda de gado',
        investidoreId: investidor,
      })
  
  
      res.redirect("/admin/venda");
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao salvar os registros no banco de dados" });
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
