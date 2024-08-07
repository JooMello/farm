const express = require("express");
const router = express.Router();
const Compra = require("./Historico");
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


router.get("/admin/compra", adminAuth, async (req, res, next) => {
  Compra.findAll({
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
  }).then(async (compras) => {
    compras.forEach((compra) => {
      compra.data = moment(compra.data).format("DD/MM/YYYY");
    });
    Investidor.findAll({ order: [["name", "ASC"]] }).then(
      async (investidores) => {
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
        res.render("admin/compra/index", {
          compras: compras,
          investidores: investidores,
          quantidade,
          mediaCompra,
          CapitalInvestido,
          CapitalInvestidoDolar,
        });
      }
    );
  });
});


router.get("/admin/compra/view/:code", adminAuth, async (req, res, next) => {

  const code = req.params.code;

  Compra.findAll({
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
  }).then((compras) => {
    compras.forEach((compra) => {
      compra.data = moment(compra.data).format("DD/MM/YYYY");
    });
    Investidor.findAll({ order: [["name", "ASC"]] }).then(
      async (investidores) => {
        //////////////////////Quantidade
        var quantidadeCompra = await Compra.findOne({
          where: {
            code: code, // Condição para encontrar a compra específica
          },
          attributes: ["quantidade"], // Substitua 'quantidade' pelo nome correto do campo na tabela Compra
          raw: true,
        });

        const quantidade = quantidadeCompra
          ? quantidadeCompra.quantidade
          : null;
        //////////////////////Capital Investidor
        var amountT = await Compra.findOne({
          where: {
            code: code,
          },
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
          where: {
            code: code,
          },
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
        var mediaCompra = Number(amountU["media"]).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });
        res.render("admin/compra/view", {
          compras: compras,
          investidores: investidores,
          quantidade,
          mediaCompra,
          CapitalInvestido,
          CapitalInvestidoDolar,
        });
      }
    );
  });
});

router.get("/admin/compra/new", adminAuth, (req, res) => {
  var cotacaoDolar = Number(cotacao).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  Investidor.findAll({ order: [["name", "ASC"]] }).then((investidores) => {
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

  // ... Resto do seu código ...

  // Formatando os valores
  const valorFloat = parseFloat(valor.replace("R$", "").replace(".", "").replace(",", "."));
  const totalAmountFloat = parseFloat(totalAmount.replace("R$", "").replace(".", "").replace(",", "."));
  const formattedPeso = formatValueOrArray(req.body.peso);
  const dolarFloat = parseFloat(dolar.replace("$", ""));
  const amountFloat = parseFloat(amount.replace("$", "").replace(",", ""));

  try {

    const existingBrincos = await Compra.findAll({
      where: {
        brinco: {
          [Op.not]: '', // Excluir brincos vazios da verificação de duplicatas
        },
      },
    });

   // Verifique se há brincos repetidos
   for (const item of brinco) {
    const exists = existingBrincos.some((existing) => existing.brinco === item);
    if (exists) {
      return res.status(400).json({ error: "Pelo menos um dos brincos já existe" });
    }
  }

    // Encontrar o último brinco e código
    const lastCompra = await Compra.findOne({
      where: {
        investidoreId: investidor,
      },
      order: [["brinco", "DESC"]],
      limit: 1,
    });

    const lastCode = await Compra.findOne({
      where: {
        investidoreId: investidor,
      },
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
    await Compra.bulkCreate(objects);

    res.redirect("/admin/compra");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao salvar os registros no banco de dados" });
  }
});

router.get("/admin/compra/edit/:id", adminAuth, (req, res) => {
  var id = req.params.id;

  Compra.findByPk(id)
    .then((compra) => {
      if (compra != undefined) {
        Investidor.findAll({ order: [["name", "ASC"]] }).then(
          (investidores) => {
            res.render("admin/compra/edit", {
              compra: compra,
              investidores: investidores,
            });
          }
        );
      } else {
        res.redirect("/admin/compra");
      }
    })
    .catch((err) => {
      res.redirect("/admin/compra");
    });
});

router.post("/compra/update", adminAuth, async(req, res) => {
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


  Compra.update(
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
    } 
  } else {
    // NULL
    res.redirect("/admin/compra");
  }
});

module.exports = router;
