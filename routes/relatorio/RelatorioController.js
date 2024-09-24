const express = require('express');
const router = express.Router();
const slugify = require("slugify");
const sequelize = require("sequelize");
const { Op } = require("sequelize");
const adminAuth = require("../../middlewares/adminAuth")
const moment = require("moment");
const Investidor = require("../investidor/Investidor");
const Compra = require('../compra/Compra');
const Venda = require('../venda/Venda');
const Morte = require("../estoque/Estoque");
const ContaCorrente = require("../financeiro/contaCorrente/ContaCorrente");
const Historico = require("../historico/Historico");


router.get("/admin/relatorio", adminAuth, async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10; // número de itens por página
  const offset = (page - 1) * limit;

  try {
    const investidores = await Investidor.findAll({
       order: [["name", "ASC"]],
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
    let amountCompra = Number(amountC["sum(`valor`)"]);

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
    console.log(lastCompra);
    let MediaCompraPonderada = 0;

    // Verificar se lastCompra.mediaPonderada é nulo ou vazio
    if (lastCompra === null || lastCompra === "") {
      // Definir MediaCompraPonderada como 0
      MediaCompraPonderada = 0;
    } else {
      // Obter o valor de mediaPonderada do último registro
      MediaCompraPonderada = lastCompra.mediaPonderada;
      mediaVenda = totalVendaSum / vendidos;
    }
    console.log(MediaCompraPonderada);
    res.render("admin/relatorios/index", {
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


module.exports = router;
