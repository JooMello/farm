const express = require("express");
const router = express.Router();
const sequelize = require("sequelize");
const Investidor = require("../../investidor/Investidor");
const adminAuth = require("../../../middlewares/adminAuth");
const moment = require('moment');
const Compra = require('../../compra/Compra');
const Historico = require("../../historico/Historico");
const Venda = require("../../venda/Venda");
const Morte = require("../../estoque/Estoque")
const ContaCorrente = require("../contaCorrente/ContaCorrente");

//filtragem de dados, por peridodo que eles foram adicionados no BD
//formatar numeros em valores decimais (.toLocaleFixed(2))
Number.prototype.toLocaleFixed = function (n) {
  return this.toLocaleString(undefined, {
    minimumFractionDigits: n,
    maximumFractionDigits: n,
  });
};

router.get("/admin/contaCorrente", adminAuth, async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10; // número de itens por página
  const offset = (page - 1) * limit;

  try {
    const investidores = await Investidor.findAll({
      raw: true,
      nest: true,
    });

    const { count, rows: contaCorrente } = await ContaCorrente.findAndCountAll({
      include: [
        {
          model: Investidor,
        },
      ],
      order: [["data", "DESC"]],
      raw: true,
      nest: true,
      limit: limit,
      offset: offset,
    });

    contaCorrente.forEach((conta) => {
      conta.data = moment(conta.data).format("DD/MM/YYYY");
    });

    //////////////////////comprados
    var ContaCorrenteTotal = await ContaCorrente.count();
    const totalPages = Math.ceil(count / 2);
    const maxPagesToShow = 5;
    let startPage, endPage;

    if (totalPages <= maxPagesToShow) {
      startPage = 1;
      endPage = totalPages;
    } else {
      if (page <= Math.ceil(maxPagesToShow / 2)) {
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (page + Math.floor(maxPagesToShow / 2) >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      } else {
        startPage = page - Math.floor(maxPagesToShow / 2);
        endPage = page + Math.floor(maxPagesToShow / 2);
      }
    }

    // Capital Investidor
    const compras = await Compra.findAll({
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
    });

    compras.forEach((compra) => {
      compra.data = moment(compra.data).format("DD/MM/YYYY");
    });

    const vendas = await Venda.findAll({
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
    });

    vendas.forEach((venda) => {
      venda.data = moment(venda.data).format("DD/MM/YYYY");
      venda.total_valor = venda.total_valor / 2;
    });

    const amountC = await Compra.findOne({
      attributes: [sequelize.fn("sum", sequelize.col("valor"))],
      raw: true,
    });

    const amountCompraV = Number(amountC["sum(`valor`)"]);
    const amountCompra = amountCompraV.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    const totalVendas = await Venda.count();

    const contaCorrentes = await ContaCorrente.findAll({
      where: {
        obs: "Crédito referente a venda de gado",
      },
      attributes: ["valor"],
    });

    let totalVendaSum = 0;
    contaCorrentes.forEach((conta) => {
      totalVendaSum += parseFloat(conta.valor);
    });

    const contaCorrentesEntrada = await ContaCorrente.findAll({
      where: {
        category: "ENTRADA",
      },
      attributes: ["valor"],
    });

    let totalSumEntrada = 0;
    contaCorrentesEntrada.forEach((entrada) => {
      totalSumEntrada += parseFloat(entrada.valor);
    });

    const contaCorrentesRetirada = await ContaCorrente.findAll({
      where: {
        category: "RETIRADA",
      },
      attributes: ["valor"],
    });

    let totalSumRetirada = 0;
    contaCorrentesRetirada.forEach((retirada) => {
      totalSumRetirada += parseFloat(retirada.valor);
    });

    totalSumRetirada = Math.abs(totalSumRetirada); // Converte para valor absoluto

    const mortes = await Morte.findAll({
      attributes: ["valor"],
      raw: true,
    });

    let sumMortes = 0;
    mortes.forEach((morte) => {
      sumMortes += parseFloat(morte.valor);
    });
    let investidorNome = "Todos os Investidores"; // Valor padrão

    const Total =
      totalSumEntrada - amountCompraV + totalVendaSum - totalSumRetirada;

    const compradosTotal = await Compra.count();

    const amountQ = await Morte.findOne({
      attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
      raw: true,
    });
    const morte = Number(amountQ["sum(`quantidade`)"]);

    //////////////////////vendidos
    const vendidos = await Venda.count();

      const estoque = compradosTotal - morte - vendidos;

      const lastCompra = await Compra.findOne({
  order: [["createdAt", "DESC"]],
});
console.log(lastCompra)
let MediaCompraPonderada = 0;

    // Verificar se lastCompra.mediaPonderada é nulo ou vazio
if (lastCompra=== null || lastCompra === "") {
  // Definir MediaCompraPonderada como 0
   MediaCompraPonderada = 0;
} else {
  // Obter o valor de mediaPonderada do último registro
  MediaCompraPonderada = lastCompra.mediaPonderada;
  mediaVenda = (totalVendaSum / vendidos);
}
console.log(MediaCompraPonderada);
    res.render("admin/financeiro/contaCorrente/index", {
      compras: compras,
      vendas: vendas,
      investidores: investidores,
      contaCorrente: contaCorrente,
      Total,
      amountCompra,
      totalVendaSum,
      currentPage: page,
      totalPages: totalPages,
      startPage: startPage,
      endPage: endPage,
      investidorNome,
      compradosTotal,
      morte,
      vendidos,
      estoque,
      MediaCompraPonderada,
      mediaVenda,
      totalSumEntrada,
      totalSumRetirada,
    });
  } catch (error) {
    next(error); // Propaga o erro para o middleware de tratamento de erros
  }
});


router.get("/admin/contaCorrente/new", adminAuth, (req, res) => {
  Investidor.findAll().then((investidores) => {
    res.render("admin/financeiro/contaCorrente/new", {
      investidores: investidores,
    });
  });
});

router.post("/contaCorrente/save", adminAuth, async (req, res) => {
  let action = req.body.action; // Capture the action value from the form
  const data = req.body.data;
  const category = req.body.category;
  const valor = req.body.valor;
  const obs = req.body.obs;
  const investidor = req.body.investidor;
  const code = req.body.code;

  const valorFloat = valor.replace(".", "").replace(",", ".");

  ContaCorrente.create({
    data: data,
    category: category,
    valor: valorFloat,
    code: code,
    obs: obs,
    investidoreId: investidor,
  }).then(() => {
    // Handle the redirect or stay on the form based on the action
    if (action === "exit") {
      res.redirect("/admin/contaCorrente?success");
    } else {
      // Quando for "Salvar e Continuar"
      res.redirect(
        "/admin/contaCorrente/new?message=Registro salvo com sucesso!"
      );
    }
  });
});

router.get("/admin/contaCorrente/edit/:id", adminAuth, (req, res) => {
  const id = req.params.id;

  ContaCorrente.findByPk(id)
    .then((contaCorrente) => {
      if (contaCorrente != undefined) {
        Investidor.findAll().then((investidores) => {
          res.render("admin/financeiro/contaCorrente/edit", {
            contaCorrente: contaCorrente,
            investidores: investidores,
          });
        });
      } else {
        res.redirect("/admin/contaCorrente");
      }
    })
    .catch((err) => {
      res.redirect("/admin/contaCorrente");
    });
});

router.post("/contaCorrente/update", adminAuth, (req, res) => {
  const id = req.body.id;
  const data = req.body.data;
  const category = req.body.category;
  const valor = req.body.valor;
  const obs = req.body.obs;
  const investidor = req.body.investidor;

  const valorFloat = valor.replace(".", "").replace(",", ".");

  ContaCorrente.update(
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
      res.redirect("/admin/contaCorrente");
    })
    .catch((err) => {
      res.send("erro:" + err);
    });
});

router.post("/contaCorrente/delete", adminAuth, (req, res) => {
  const id = req.body.id;
  const code = req.body.code;
  console.log(id)
  console.log(code)
  if (id != undefined) {
    if (!isNaN(id)) {
      ContaCorrente.destroy({
        where: {
          id: id,
        },
      }).then(() => {
        Historico.destroy({
          where: {
            code: code,
          },
        }).then(() => {
      Compra.destroy({
        where: {
          code: code,
        },
      }).then(() => {
        Venda.destroy({
          where: {
            code: code,
          },
        }).then(() => {
        res.redirect("/admin/contaCorrente");
      });
    });
  });
});
    } else {
      // NÃO FOR UM NÚMERO
      res.redirect("/admin/contaCorrente");
    }
  } else {
    // NULL
    res.redirect("/admin/contaCorrente");
  }
});

module.exports = router;
