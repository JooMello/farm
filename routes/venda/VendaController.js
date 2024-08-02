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
const Compra = require("../compra/Compra");
const Morte = require("../estoque/Estoque");
const Historico = require("../historico/Historico");

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
  const formattedValue = parseFloat(
    value.replace("R$", "").replace(".", "").replace(",", ".")
  );
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
    return value.map((val) => formatCurrency(val));
  } else {
    return formatCurrency(value);
  }
}

router.get("/admin/venda", adminAuth, async (req, res, next) => {

   const page = parseInt(req.query.page) || 1;
   const limit = 10; // número de itens por página
   const offset = (page - 1) * limit;
   
   const { count, rows: vendas } = await Venda.findAndCountAll({
     include: [
       {
         model: Investidor,
       },
     ],
     attributes: [
       "data",
       "code",
       "quantidade",
       "mediaPonderada",
       "valorInvestidor",
       "valorFazenda",
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
       "mediaPonderada",
       "valorInvestidor",
       "valorFazenda",
     ],
     order: [["data", "DESC"]],
     raw: true,
     nest: true,
     limit: limit,
     offset: offset,
   });
     vendas.forEach((venda) => {
       venda.data = moment(venda.data).format("DD/MM/YYYY");
     });

     
const totalPages = Math.ceil(count / limit);

     Investidor.findAll().then(async (investidores) => {
       //////////////////////Quantidade
       var quantidade = await Venda.count();

       //////////////////////valor Venda
       var amountT = await Venda.findOne({
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

       //////////////////////valor Venda em dolar
       var amountD = await Venda.findOne({
         attributes: [sequelize.fn("sum", sequelize.col("amount"))],

         raw: true,
       });
       var TotalVendaDolar = Number(amountD["sum(`amount`)"]).toLocaleString(
         "en-US",
         { style: "currency", currency: "USD" }
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
         currentPage: page,
         totalPages: totalPages,
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
        attributes: ["quantidade"], // Substitua 'quantidade' pelo nome correto do campo na tabela venda
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
      var ValorVenda = Number(amountT["sum(`valor`)"]).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });

      //////////////////////Capital Investidor em dolar
      var amountD = await Venda.findOne({
        where: {
          code: code,
        },
        attributes: [sequelize.fn("sum", sequelize.col("amount"))],

        raw: true,
      });
      var TotalVendaDolar = Number(amountD["sum(`amount`)"]).toLocaleString(
        "en-US",
        {
          style: "currency",
          currency: "USD",
        }
      );

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
  Compra.findAll({
    where: {
      status: "Em estoque",
    },
  }).then((compras) => {
    Investidor.findAll().then((investidores) => {
      res.render("admin/venda/new", {
        compras: compras,
        investidores: investidores,
        cotacao: cotacao,
        cotacaoDolar: cotacaoDolar,
      });
    });
  });
});

router.post("/venda/save", adminAuth, async (req, res) => {
  let action = req.body.action; // Capture the action value from the form
  const id = req.body.id;
  const code = req.body.code ?? 1;
  const brinco = req.body.brinco;
  const data = req.body.data;
  const quantidade = req.body.quantidade;
  const valor = req.body.valor;
  const totalAmount = req.body.totalAmount;
  const peso = req.body.peso;
  const dolar = req.body.dolar;
  const amount = req.body.amount;
  const obs = req.body.obs;
  const investidor = req.body.investidor;

  const totalAmountFloat = parseFloat(
    totalAmount.replace("R$", "").replace(".", "").replace(",", ".")
  );
  const formattedPeso = formatValueOrArray(req.body.peso);
  const dolarFloat = parseFloat(dolar.replace("$", ""));
  const amountFloat = parseFloat(amount.replace("$", "").replace(",", ""));

  // Consultar o banco de dados para obter o último registro de Compra
  const lastCompra = await Compra.findOne({
    where: { investidoreId: investidor },
    order: [["createdAt", "DESC"]],
  });
  console.log(lastCompra);
  let MediaCompraPonderada = 0;

  const nearestCompra = await Compra.findOne({
    where: {
      investidoreId: investidor,
      data: {
        [Op.lte]: data, // Filtra as datas menores ou iguais à data fornecida
      },
    },
    order: [["createdAt", "DESC"]], // Ordena por data decrescente para obter a mais próxima
  });
  // Obter o valor de mediaPonderada do último registro
  MediaCompraPonderada = nearestCompra ? nearestCompra.mediaPonderada : null;

  // Verificar se lastCompra.mediaPonderada é nulo ou vazio
  if (lastCompra === null || lastCompra === "") {
    // Definir MediaCompraPonderada como 0
    MediaCompraPonderada = 0;
  } else {
    // Obter o valor de mediaPonderada do último registro
    MediaCompraPonderada = nearestCompra ? nearestCompra.mediaPonderada : null;
  }
  console.log(MediaCompraPonderada);
  const ValorQuantidade = MediaCompraPonderada * quantidade;
  console.log(ValorQuantidade);
  const divisao = ValorQuantidade / 2;
  console.log(divisao);
  const diferenca = totalAmountFloat - ValorQuantidade;
  console.log(diferenca);
  const valorRecebimento = diferenca + divisao;
  console.log(valorRecebimento);

  const capitalLucro =
    (totalAmountFloat - MediaCompraPonderada * quantidade) / 2 +
    MediaCompraPonderada * quantidade;
  const valorFazenda = totalAmountFloat - capitalLucro;
  try {
    // Encontrar o investidor pelo id
    const investidorObj = await Investidor.findOne({
      where: {
        id: investidor,
      },
    });

    // Verificar se o investidor foi encontrado
    if (!investidorObj) {
      return res.status(400).json({ error: "Investidor não encontrado" });
    }

    // Obter o valor do campo "letras" do investidor
    const letrasDoInvestidor = investidorObj.letras;

    const lastCode = await Venda.max("code");

    const nextCode = lastCode ? lastCode + 1 : 1;
    console.log(valor);

    if (quantidade > 1) {
      const objects = [];

      for (let i = 0; i < quantidade; i++) {
        const brincoValue = brinco[i] ? letrasDoInvestidor + brinco[i] : null;

        objects.push({
          id: id,
          data: data,
          brinco: brincoValue,
          quantidade: quantidade,
          code: nextCode,
          valor: valor[i],
          totalAmount: totalAmountFloat,
          peso: formattedPeso[i],
          dolar: dolarFloat,
          amount: amountFloat,
          mediaPonderada: MediaCompraPonderada,
          valorInvestidor: capitalLucro,
          valorFazenda: valorFazenda,
          obs: obs,
          investidoreId: investidor,
          status: "Vendido",
        });
      }

      // Inserir os registros no banco de dado
      await Venda.bulkCreate(objects);
      ContaCorrente.create({
        data: data,
        code: nextCode,
        category: "CREDITO",
        valor: capitalLucro,
        obs: "Crédito referente a venda de gado",
        investidoreId: investidor,
      });
    } else if (quantidade == 1) {
      const brincoValue = brinco ? letrasDoInvestidor + brinco : null;

      const singleObject = {
        id: id,
        data: data,
        brinco: brincoValue,
        quantidade: quantidade,
        code: nextCode,
        valor: valor,
        totalAmount: totalAmountFloat,
        peso: formattedPeso,
        dolar: dolarFloat,
        amount: amountFloat,
        mediaPonderada: MediaCompraPonderada,
        valorInvestidor: capitalLucro,
        valorFazenda: valorFazenda,
        obs: obs,
        investidoreId: investidor,
        status: "Vendido",
      };

      // Inserir os registros no banco de dado
      await Venda.create(singleObject);
      ContaCorrente.create({
        data: data,
        code: nextCode,
        category: "CREDITO",
        valor: capitalLucro,
        obs: "Crédito referente a venda de gado",
        investidoreId: investidor,
      });
    }

    if (action === "exit") {
      res.redirect("/admin/venda?success");
    } else {
      // Quando for "Salvar e Continuar"
      res.redirect("/admin/venda/new?message=Registro salvo com sucesso!");
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Erro ao salvar os registros no banco de dados" });
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
  var code = req.body.code;
  if (code != undefined) {
    if (!isNaN(code)) {
      ContaCorrente.destroy({
        where: {
          code: code,
        },
      }).then(() => {
        Venda.destroy({
          where: {
            code: code,
          },
        }).then(() => {
          res.redirect("/admin/venda");
        });
      });
    }
  } else {
    // NULL
    res.redirect("/admin/venda");
  }
});

module.exports = router;
