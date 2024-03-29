const express = require("express");
const router = express.Router();
const Compra = require("./Compra");
const Historico = require("../historico/Historico");
const slugify = require("slugify");
const sequelize = require("sequelize");
const { Op } = require("sequelize");
const request = require("request");
const ContaCorrente = require("../financeiro/contaCorrente/ContaCorrente");

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
    Investidor.findAll().then(async (investidores) => {
      Historico.findAll().then(async (historico) => {
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
          historico,
          quantidade,
          mediaCompra,
          CapitalInvestido,
          CapitalInvestidoDolar,
        });
      });
    });
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
    Investidor.findAll().then(async (investidores) => {
      //////////////////////Quantidade
      var quantidadeCompra = await Compra.findOne({
        where: {
          code: code, // Condição para encontrar a compra específica
        },
        attributes: ["quantidade"], // Substitua 'quantidade' pelo nome correto do campo na tabela Compra
        raw: true,
      });

      const quantidade = quantidadeCompra ? quantidadeCompra.quantidade : null;
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
    });
  });
});

router.get(
  "/admin/compra/view/historico/:identificador",
  adminAuth,
  async (req, res, next) => {
    const identificador = req.params.identificador;

    Historico.findAll({
      where: {
        identificador: identificador,
      },
      include: [
        {
          model: Investidor,
        },
      ],
      order: [["data", "DESC"]],
      raw: true,
      nest: true,
    }).then((historicos) => {
      historicos.forEach((historico) => {
        historico.data = moment(historico.data).format("DD/MM/YYYY");
      });
      Investidor.findAll().then(async (investidores) => {
        res.render("admin/compra/historico", {
          historicos: historicos,
          investidores: investidores,
        });
      });
    });
  }
);

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
  let identificador = req.body.identificador;
  // ... Resto do seu código ...


  const totalAmountFloat = parseFloat(
    totalAmount.replace("R$", "").replace(".", "").replace(",", ".")
  );
  const formattedPeso = formatValueOrArray(req.body.peso);
  const dolarFloat = parseFloat(dolar.replace("$", ""));
  const amountFloat = parseFloat(amount.replace("$", "").replace(",", ""));

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

    const existingBrincos = await Compra.findAll({
      where: {
        brinco: {
          [Op.not]: "", // Excluir brincos vazios da verificação de duplicatas
        },
      },
    });

    // Verifique se há brincos repetidos
    for (const item of brinco) {
      const exists = existingBrincos.some(
        (existing) => existing.brinco === item
      );
      if (exists) {
        return res
          .status(400)
          .json({ error: "Pelo menos um dos brincos já existe" });
      }
    }

    // Encontrar o último brinco e código
    const lastCompra = await Compra.findOne({
      order: [["brinco", "DESC"]],
      limit: 1,
    });

    const lastCode = await Compra.findOne({
      order: [["code", "DESC"]],
      limit: 1,
    });

    const nextCode = lastCode ? parseInt(lastCode.code) + 1 : 1;

    const lastIdentificador = await Compra.findOne({
      attributes: [
        [
          sequelize.fn("MAX", sequelize.col("identificador")),
          "lastIdentificador",
        ],
      ],
    });

    let nextIdentificador = 1;

    if (lastIdentificador && lastIdentificador.dataValues.lastIdentificador) {
      nextIdentificador = lastIdentificador.dataValues.lastIdentificador + 1;
    }

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
          obs: obs,
          investidoreId: investidor,
          identificador: nextIdentificador,
          status: "Em estoque",
        });
        nextIdentificador++;
      }

      // Inserir os registros no banco de dados
      await Compra.bulkCreate(objects);
      await Historico.bulkCreate(objects);
      ContaCorrente.create({
        code: nextCode,
        data: data,
        category: "DEBITO",
        valor: -totalAmountFloat,
        obs: "Débito referente a compra de gado",
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
        obs: obs,
        investidoreId: investidor,
        identificador: nextIdentificador,
        status: "Em estoque",
      };

      // Inserir o registro no banco de dados
      await Compra.create(singleObject);
      await Historico.create(singleObject);
      ContaCorrente.create({
        code: nextCode,
        data: data,
        category: "DEBITO",
        valor: -totalAmountFloat,
        obs: "Débito referente a compra de gado",
        investidoreId: investidor,
      });
      // ... (Remaining code)
    } else {
      // Handle the case when quantity is less than 1 if needed
    }

    res.redirect("/admin/compra");
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Erro ao salvar os registros no banco de dados" });
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

router.post("/compra/update", adminAuth, async (req, res) => {
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
  let identificador = req.body.identificador;

  const valorFloat = parseFloat(
    valor.replace("R$", "").replace(".", "").replace(",", ".")
  );
  const totalAmountFloat = parseFloat(
    totalAmount.replace("R$", "").replace(".", "").replace(",", ".")
  );
  const formattedPeso = formatValueOrArray(req.body.peso);
  const dolarFloat = parseFloat(dolar.replace("$", ""));
  const amountFloat = parseFloat(amount.replace("$", "").replace(",", ""));

  Compra.update(
    {
      data: data,
      quantidade: quantidade,
      brinco: brinco,
      valor: valorFloat,
      totalAmount: totalAmountFloat,
      peso: formattedPeso,
      obs: obs,
      investidoreId: investidor,
    },
    {
      where: {
        id: id,
      },
    }
  );
  ContaCorrente.update(
    {
      data: data,
      valor: -totalAmountFloat,
    },
    {
      where: {
        code: code,
      },
    }
  );
  Historico.create({
    data: data,
    brinco: brinco,
    quantidade: quantidade,
    code: code,
    valor: valor,
    totalAmount: totalAmountFloat,
    peso: formattedPeso,
    dolar: dolarFloat,
    amount: amountFloat,
    obs: obs,
    investidoreId: investidor,
    identificador: identificador,
  })
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
