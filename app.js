const express = require("express");
const request = require("request");
const path = require("path");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bodyParser = require("body-parser");
const routes = require("./routes");
const app = express();
const nodemailer = require("nodemailer");
const adminAuth = require("./middlewares/adminAuth");
const sequelize = require("sequelize");
const Op = sequelize.Op;
const slugify = require("slugify");
const connection = require("./database/database");
const dolar = require("./modules/api_dolar");
const cep = require("./modules/api-cep");
const fs = require("fs");
const moment = require("moment");

var investidorRouter = require("./routes/investidor/InvestidorController");
var compraRouter = require("./routes/compra/CompraController");
var historicoRouter = require("./routes/compra/CompraController");
var vendaRouter = require("./routes/venda/VendaController");
var relatorioRouter = require("./routes/relatorio/RelatorioController");
var estoqueRouter = require("./routes/estoque/EstoqueController");
var contaCorrenteRouter = require("./routes/financeiro/contaCorrente/ContaCorrenteController");
var userRouter = require("./routes/users/UsersController");

///////////////
const Investidor = require("./routes/investidor/Investidor");
const Compra = require("./routes/compra/Compra");
const Venda = require("./routes/venda/Venda");
const Morte = require("./routes/estoque/Estoque");
const User = require("./routes/users/User");
const  ContaCorrente = require("./routes/financeiro/contaCorrente/ContaCorrente");const Historico = require("./routes/historico/Historico")

//view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: "qualquercoisa",
    cookie: {
      maxAge: 3000234433240000,
    },
  })
);

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", routes);
app.use("/", investidorRouter);
app.use("/", compraRouter);
app.use("/", historicoRouter);
app.use("/", vendaRouter);
app.use("/", relatorioRouter);
app.use("/", estoqueRouter);
app.use("/", contaCorrenteRouter);
app.use("/", userRouter);;

connection
  .authenticate()
  .then(() => {
    console.log("Conexão feita com sucesso!");
  })
  .catch((error) => {
    console.log(error);
  });

//Compra
app.get("/compra/:id", adminAuth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10; // número de itens por página
  const offset = (page - 1) * limit;
  var id = req.params.id;
  const { count, rows: compras } = await Compra.findAndCountAll({
    include: [
      {
        model: Investidor,
      },
    ],
    where: {
      investidoreId: id,
    },
    attributes: [
      "data",
      "code",
      "quantidade",
      "mediaPonderada",
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
      "mediaPonderada",
      "obs",
      "investidoreId",
    ],
    order: [["data", "DESC"]],
    raw: true,
    nest: true,
    limit: limit,
    offset: offset,
  });
    
      compras.forEach((compra) => {
        compra.data = moment(compra.data).format("DD/MM/YYYY");
      });
 var compradosTotal = await Compra.count({
   where: {
     investidoreId: id,
   },
 });
 const totalPages = Math.ceil(count / compradosTotal);
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
      Investidor.findAll({ order: [["name", "ASC"]] }).then(
        async (investidores) => {
          Historico.findAll({
            where: {
              investidoreId: id,
            },
          }).then(async (historico) => {
            //////////////////////Quantidade
            var quantidade = await Compra.count({
              where: {
                investidoreId: id,
              },
            });

            //////////////////////Capital Investidor
            var amountT = await Compra.findOne({
              attributes: [sequelize.fn("sum", sequelize.col("valor"))],
              where: {
                investidoreId: id,
              },
              raw: true,
            });
            var CapitalInvestido = Number(
              amountT["sum(`valor`)"]
            ).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            });

            //////////////////////média valor
            var amounC = await Compra.findOne({
              attributes: [sequelize.fn("avg", sequelize.col("valor"))],
              where: {
                investidoreId: id,
              },
              raw: true,
            });
            var mediaCompra = Number(amounC["avg(`valor`)"]).toLocaleString(
              "pt-BR",
              {
                style: "currency",
                currency: "BRL",
              }
            );

            //////////////////////Capital Investidor em dolar
            var amountD = await Compra.findOne({
              attributes: [sequelize.fn("sum", sequelize.col("amount"))],
              where: {
                investidoreId: id,
              },
              raw: true,
            });
            var CapitalInvestidoDolar = Number(
              amountD["sum(`amount`)"]
            ).toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            });

            res.render("admin/compra/index", {
              investidores: investidores,
              compras: compras,
              historico,
              quantidade,
              mediaCompra,
              CapitalInvestido,
              CapitalInvestidoDolar,
              currentPage: page,
              totalPages: totalPages,
              startPage: startPage,
              endPage: endPage,
            });
          });
        }
      );
    })


//Data-filter Compra
app.get("/compra", adminAuth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10; // número de itens por página
  const offset = (page - 1) * limit;
  const { start, end } = req.query; //Obter as datas da rota ao invés do corpo da requisição
  const { count, rows: compras } = await Compra.findAndCountAll({
    include: [
      {
        model: Investidor,
      },
    ],
    where: {
      data: {
        [Op.between]: [start, end],
      },
    },
    attributes: [
      "data",
      "code",
      "quantidade",
      "mediaPonderada",
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
      "mediaPonderada",
      "obs",
      "investidoreId",
    ],
    order: [["data", "DESC"]],
    raw: true,
    nest: true,
  });
  
      compras.forEach((compra) => {
        compra.data = moment(compra.data).format("DD/MM/YYYY");
      });

      var compradosTotal = await Compra.count({
        where: {
          data: {
            [Op.between]: [start, end],
          },
        },
      });
      const totalPages = Math.ceil(count / compradosTotal);
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

      Investidor.findAll({ order: [["name", "ASC"]] }).then(
        async (investidores) => {
          //////////////////////Quantidade
          var quantidade = await Compra.count({
            where: {
              data: {
                [Op.between]: [start, end],
              },
            },
          });

          //////////////////////Capital Investidor
          var amountT = await Compra.findOne({
            attributes: [sequelize.fn("sum", sequelize.col("valor"))],
            where: {
              data: {
                [Op.between]: [start, end],
              },
            },
            raw: true,
          });
          var CapitalInvestido = Number(amountT["sum(`valor`)"]).toLocaleString(
            "pt-BR",
            {
              style: "currency",
              currency: "BRL",
            }
          );

          //////////////////////média valor
          var amounC = await Compra.findOne({
            attributes: [sequelize.fn("avg", sequelize.col("valor"))],
            where: {
              data: {
                [Op.between]: [start, end],
              },
            },
            raw: true,
          });
          var mediaCompra = Number(amounC["avg(`valor`)"]).toLocaleString(
            "pt-BR",
            {
              style: "currency",
              currency: "BRL",
            }
          );

          //////////////////////Capital Investidor em dolar
          var amountD = await Compra.findOne({
            attributes: [sequelize.fn("sum", sequelize.col("amount"))],
            where: {
              data: {
                [Op.between]: [start, end],
              },
            },
            raw: true,
          });
          var CapitalInvestidoDolar = Number(
            amountD["sum(`amount`)"]
          ).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          });

          res.render("admin/compra/index", {
            investidores: investidores,
            compras: compras,
            quantidade,
            mediaCompra,
            CapitalInvestido,
            CapitalInvestidoDolar,
            currentPage: page,
            totalPages: totalPages,
            startPage: startPage,
            endPage: endPage,
          });
        }
      );
    })

//Data-filter Venda
app.get("/venda", adminAuth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10; // número de itens por página
  const offset = (page - 1) * limit;
  const { start, end } = req.query; //Obter as datas da rota ao invés do corpo da requisição
  const { count, rows: vendas } = await Venda.findAndCountAll({
    include: [
      {
        model: Investidor,
      },
    ],
    where: {
      data: {
        [Op.between]: [start, end],
      },
    },
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
  });
      vendas.forEach((venda) => {
        venda.data = moment(venda.data).format("DD/MM/YYYY");
      });

 var vendidosTotal = await Venda.count({
   where: {
     data: {
       [Op.between]: [start, end],
     },
   },
 });

 const totalPages = Math.ceil(count / vendidosTotal);

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

      Investidor.findAll({ order: [["name", "ASC"]] }).then(
        async (investidores) => {
          //////////////////////Quantidade
          var quantidade = await Venda.count({
            where: {
              data: {
                [Op.between]: [start, end],
              },
            },
          });

          //////////////////////valor Venda
          var amountT = await Venda.findOne({
            attributes: [sequelize.fn("sum", sequelize.col("valor"))],
            where: {
              data: {
                [Op.between]: [start, end],
              },
            },
            raw: true,
          });
          var ValorVenda = Number(amountT["sum(`valor`)"]).toLocaleString(
            "pt-BR",
            {
              style: "currency",
              currency: "BRL",
            }
          );

          //////////////////////Total Venda em dolar
          var amountD = await Venda.findOne({
            attributes: [sequelize.fn("sum", sequelize.col("amount"))],
            where: {
              data: {
                [Op.between]: [start, end],
              },
            },
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
              data: {
                [Op.between]: [start, end],
              },
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

          res.render("admin/venda/index", {
            investidores: investidores,
            vendas: vendas,
            mediaVenda,
            quantidade,
            ValorVenda,
            TotalVendaDolar,
            currentPage: page,
            totalPages: totalPages,
            startPage: startPage,
            endPage: endPage,
          });
        }
      );
});

app.get("/venda/:id", adminAuth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10; // número de itens por página
  const offset = (page - 1) * limit;
  var id = req.params.id;
  const { count, rows: vendas } = await Venda.findAndCountAll({
    include: [
      {
        model: Investidor,
      },
    ],
    where: {
      investidoreId: id,
    },
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

     var vendidosTotal = await Venda.count({
       where: {
         investidoreId: id,
       },
     });

const totalPages = Math.ceil(count / vendidosTotal);

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

      Investidor.findAll({ order: [["name", "ASC"]] }).then(
        async (investidores) => {
          //////////////////////Quantidade
          //////////////////////Quantidade
          var quantidade = await Venda.count({
            where: {
              investidoreId: id,
            },
          });
          //////////////////////valor Venda
          var amountT = await Venda.findOne({
            attributes: [sequelize.fn("sum", sequelize.col("valor"))],
            where: {
              investidoreId: id,
            },
            raw: true,
          });
          var ValorVenda = Number(amountT["sum(`valor`)"]).toLocaleString(
            "pt-BR",
            {
              style: "currency",
              currency: "BRL",
            }
          );

          //////////////////////Total Venda em dolar
          var amountD = await Venda.findOne({
            attributes: [sequelize.fn("sum", sequelize.col("amount"))],
            where: {
              investidoreId: id,
            },
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
              investidoreId: id,
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

          res.render("admin/venda/index", {
            investidores: investidores,
            vendas: vendas,
            mediaVenda,
            quantidade,
            ValorVenda,
            TotalVendaDolar,
            currentPage: page,
            totalPages: totalPages,
            startPage: startPage,
            endPage: endPage,
          });
        }
      );
});

app.get("/contaCorrente/:id", adminAuth, async (req, res, next) => {
  var id = req.params.id;

  const page = parseInt(req.query.page) || 1;
  const limit = 10; // número de itens por página
  const offset = (page - 1) * limit;

  const investidores = await Investidor.findAll({
    order: [["name", "ASC"]],
    raw: true,
    nest: true,
  });
  const investidorNome = await Investidor.findOne({
    where: {
      id: id,
    },
    attributes: ["name"],
    raw: true,
    nest: true,
  }).then((result) => result.name);

  const { count, rows: contaCorrente } = await ContaCorrente.findAndCountAll({
    where: {
      investidoreId: id,
    },
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

  const compras = await Compra.findAll({
    where: {
      investidoreId: id,
    },
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
    where: {
      investidoreId: id,
    },
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

  var amountC = await Compra.findOne({
    attributes: [sequelize.fn("sum", sequelize.col("valor"))],
    where: {
      investidoreId: id,
    },
    raw: true,
  });
  var amountCompra = Number(amountC["sum(`valor`)"]).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const contaCorrentes = await ContaCorrente.findAll({
    where: {
      investidoreId: id,
      obs: "Crédito referente a venda de gado",
    },
    attributes: ["valor"],
  });

  let totalVendaSum = 0;
  contaCorrentes.forEach((contaCorrente) => {
    totalVendaSum += parseFloat(contaCorrente.valor);
  });

  const contaCorrentesEntrada = await ContaCorrente.findAll({
    where: {
      investidoreId: id,
      category: "ENTRADA",
    },
    attributes: ["valor"],
  });

  let totalSumEntrada = 0;
  contaCorrentesEntrada.forEach((contaCorrentesEntrada) => {
    totalSumEntrada += parseFloat(contaCorrentesEntrada.valor);
  });
  const contaCorrentesRetirada = await ContaCorrente.findAll({
    where: {
      investidoreId: id,
      category: "RETIRADA",
    },
    attributes: ["valor"],
  });

  let totalSumRetirada = 0;
  contaCorrentesRetirada.forEach((contaCorrentesRetirada) => {
    totalSumRetirada += parseFloat(contaCorrentesRetirada.valor);
  });

  totalSumRetirada = Math.abs(totalSumRetirada); // Converte para valor absoluto

  const amountCompraV = Number(amountC["sum(`valor`)"]);

  const mortes = await Morte.findAll({
    attributes: ["valor"],
    where: {
      investidoreId: id,
    },
    raw: true,
  });

  let sumMortes = 0;
  mortes.forEach((morte) => {
    sumMortes += parseFloat(morte.valor);
  });

  const Total =
    totalSumEntrada - amountCompraV + totalVendaSum - totalSumRetirada;

  var amountQ = await Morte.findOne({
    attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
    where: {
      investidoreId: id,
    },
    raw: true,
  });
  var morte = Number(amountQ["sum(`quantidade`)"]);

  var compradosTotal = await Compra.count({
    attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
    where: {
      investidoreId: id,
    },
  });

  var vendidos = await Venda.count({
    attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
    where: {
      investidoreId: id,
    },
  });

  //////////////////////estoque
  var estoque = compradosTotal - morte - vendidos;

  // Consultar o banco de dados para obter o último registro de Compra
  const lastCompra = await Compra.findOne({
    where: {
      investidoreId: id,
    },
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
  }

    mediaVenda = totalVendaSum / vendidos;

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
});


//data-filter contaCorrente
app.get("/contaCorrente", adminAuth, async (req, res, next) => {
  const { start, end } = req.query; //Obter as datas da rota ao invés do corpo da requisição
     const page = parseInt(req.query.page) || 1;
     const limit = 10; // número de itens por página
     const offset = (page - 1) * limit;

      let investidorNome = "Todos os Investidores"; // Valor padrão


           const investidores = await Investidor.findAll({
             order: [["name", "ASC"]],
             raw: true,
             nest: true,
           });

           const { count, rows: contaCorrente } =
             await ContaCorrente.findAndCountAll({
               where: {
                 data: {
                   [Op.between]: [start, end],
                 },
               },
               include: [
                 {
                   model: Investidor,
                 },
               ],
               order: [["data", "DESC"]],
               raw: true,
               nest: true,
             });
           contaCorrente.forEach((conta) => {
             conta.data = moment(conta.data).format("DD/MM/YYYY");
           });
 var ContaCorrenteTotal = await ContaCorrente.count();
 const totalPages = Math.ceil(count / 1);
 console.log(totalPages);
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


           const compras = await Compra.findAll({
             where: {
               data: {
                 [Op.between]: [start, end],
               },
             },
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
             group: [
               "data",
               "code",
               "quantidade",
               "dolar",
               "obs",
               "investidoreId",
             ],
             order: [["data", "DESC"]],
             raw: true,
             nest: true,
           });

           compras.forEach((compra) => {
             compra.data = moment(compra.data).format("DD/MM/YYYY");
           });

           const vendas = await Venda.findAll({
             where: {
               data: {
                 [Op.between]: [start, end],
               },
             },
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
             group: [
               "data",
               "code",
               "quantidade",
               "dolar",
               "obs",
               "investidoreId",
             ],
             order: [["data", "DESC"]],
             raw: true,
             nest: true,
           });

           vendas.forEach((venda) => {
             venda.data = moment(venda.data).format("DD/MM/YYYY");
             venda.total_valor = venda.total_valor / 2;
           });

          var amountC = await Compra.findOne({
            attributes: [sequelize.fn("sum", sequelize.col("valor"))],
            where: {
              data: {
                [Op.between]: [start, end],
              },
            },
            raw: true,
          });
          var amountCompra = Number(amountC["sum(`valor`)"]).toLocaleString(
            "pt-BR",
            {
              style: "currency",
              currency: "BRL",
            }
          );

          const contaCorrentes = await ContaCorrente.findAll({
            where: {
              data: {
                [Op.between]: [start, end],
              },
              obs: "Crédito referente a venda de gado"
            },
            attributes: ['valor']
          });

          let totalVendaSum = 0;
          contaCorrentes.forEach(contaCorrente => {
            totalVendaSum += parseFloat(contaCorrente.valor);
          });

          const amountCompraV = Number(amountC["sum(`valor`)"]);

          const mortes = await Morte.findAll({
            attributes: ['valor'],
             where: {
              data: {
                [Op.between]: [start, end],
              },
            },
            raw: true,
          });
        
          let sumMortes = 0;
          mortes.forEach(morte => {
            sumMortes += parseFloat(morte.valor);
          });

          const Total = amountCompraV - totalVendaSum - sumMortes;

          
  var amountQ = await Morte.findOne({
    attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
    where: {
      data: {
        [Op.between]: [start, end],
      },
    },
    raw: true,
  });
  var morte = Number(amountQ["sum(`quantidade`)"]);

  var compradosTotal = await Compra.count({
    attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
    where: {
      data: {
        [Op.between]: [start, end],
      },
    },
  });

  var vendidos = await Venda.count({
    attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
    where: {
      data: {
        [Op.between]: [start, end],
      },
    },
  });

  //////////////////////estoque
  var estoque = compradosTotal - morte - vendidos;

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
          });
        });

//Estoque
app.get("/estoque/:id", adminAuth, async (req, res) => {
  var id = req.params.id;

  //////////////////////mortes
  var amountQ = await Morte.findOne({
    attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
    where: {
      investidoreId: id,
    },
    raw: true,
  });
  var morte = Number(amountQ["sum(`quantidade`)"]);

  //////////////////////Valor  mortes
  var amountQ = await Morte.findOne({
    attributes: [sequelize.fn("sum", sequelize.col("valor"))],
    where: {
      investidoreId: id,
    },
    raw: true,
  });
  var valorf = Number(amountQ["sum(`valor`)"]);
  var valor = Number(amountQ["sum(`valor`)"]).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  //////////////////////comprados
  var amountQc = await Compra.findOne({
    attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
    where: {
      investidoreId: id,
    },
    raw: true,
  });
  var comprados = Number(amountQc["sum(`quantidade`)"]);

  //////////////////////vendidos
  var amountQv = await Venda.findOne({
    attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
    where: {
      investidoreId: id,
    },
    raw: true,
  });


  //////////////////////vendidos
  var vendidos = await Venda.count({
    attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
    where: {
      investidoreId: id,
    },
  });


  Compra.findAll({
    include: [
      {
        model: Investidor,
      },
    ],
    where: {
      investidoreId: id,
    },
  })
    .then((compras) => {
      Venda.findAll({
        include: [
          {
            model: Investidor,
          },
        ],
        where: {
          investidoreId: id,
        },
      }).then((vendas) => {
        Morte.findAll({
          include: [
            {
              model: Investidor,
            },
          ],
          where: {
            investidoreId: id,
          },
        }).then((mortes) => {
          Investidor.findAll({ order: [["name", "ASC"]] }).then(
            async (investidores) => {
              var amountT = await ContaCorrente.findOne({
                attributes: [sequelize.fn("sum", sequelize.col("valor"))],
                where: {
                  investidoreId: id,
                },
                raw: true,
              });
              var Totalf = Number(amountT["sum(`valor`)"]);
              var Total = Number(amountT["sum(`valor`)"]).toLocaleString(
                "pt-BR",
                { style: "currency", currency: "BRL" }
              );

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
                where: {
                  investidoreId: id,
                },
                raw: true,
              });
              var MediaCompra = Number(amountU["media"]).toLocaleString(
                "pt-BR",
                {
                  style: "currency",
                  currency: "BRL",
                }
              );

              var capitalInvestido = await Compra.findOne({
                attributes: [sequelize.fn("sum", sequelize.col("valor"))],
                where: {
                  investidoreId: id,
                },
                raw: true,
              });
              var TotalcapitalInvestido = Number(
                capitalInvestido["sum(`valor`)"]
              );
              var TotalC = TotalcapitalInvestido.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              });
              // Consultar o banco de dados para obter o último registro de Compra
              const lastCompra = await Compra.findOne({
                where: {
                  investidoreId: id,
                },
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
              }

              //////////////////////comprados
              var compradosTotal = await Compra.count({
                attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
                where: {
                  investidoreId: id,
                },
              });

              //////////////////////estoque
              var estoque = compradosTotal - morte - vendidos;

              const mortes = await Morte.findAll({
                attributes: ["valor"],
                where: {
                  investidoreId: id,
                },
                raw: true,
              });

              let sumMortes = 0;
              mortes.forEach((morte) => {
                sumMortes += parseFloat(morte.valor);
              });

              const contaCorrentes = await ContaCorrente.findAll({
                where: {
                  investidoreId: id,
                  obs: "Crédito referente a venda de gado",
                },
                attributes: ["valor"],
              });

              let totalVendaSum = 0;
              contaCorrentes.forEach((contaCorrente) => {
                totalVendaSum += parseFloat(contaCorrente.valor);
              });

              var CapitalEstoque = (
                TotalcapitalInvestido -
                totalVendaSum -
                sumMortes
              ).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              });
              res.render("admin/estoque/index", {
                compras: compras,
                vendas: vendas,
                mortes: mortes,
                valor: valor,
                Total,
                MediaCompra,
                MediaCompraPonderada,
                CapitalEstoque,
                investidores: investidores,
                morte,
                comprados,
                compradosTotal,
                vendidos,
                estoque,
                TotalC,
              });
            }
          );
        });
      });
    })
    .catch((err) => {
      res.redirect("admin/estoque/index");
    });
});

//Morte
app.get("/morte/:id", adminAuth, async (req, res) => {
  var id = req.params.id;

  //////////////////////mortes
  var amountQ = await Morte.findOne({
    attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
    where: {
      investidoreId: id,
    },
    raw: true,
  });
  var qmorte = Number(amountQ["sum(`quantidade`)"]);

  //////////////////////valor mortes
  var amountV = await Morte.findOne({
    attributes: [sequelize.fn("sum", sequelize.col("valor"))],
    where: {
      investidoreId: id,
    },
    raw: true,
  });
  var qvalor = Number(amountV["sum(`valor`)"]).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  Morte.findAll({
    include: [
      {
        model: Investidor,
      },
    ],
    where: {
      investidoreId: id,
    },
    order: [["createdAt", "DESC"]],
    raw: true,
    nest: true,
  })
    .then((mortes) => {
      mortes.forEach((morte) => {
        morte.data = moment(morte.data).format("DD/MM/YYYY");
      });
      Investidor.findAll({ order: [["name", "ASC"]] }).then((investidores) => {
        res.render("admin/estoque/morte", {
          mortes: mortes,
          investidores: investidores,
          qmorte,
          qvalor,
        });
      });
    })
    .catch((err) => {
      res.redirect("admin/estoque/morte");
    });
});

//data-filter Morte
app.get("/morte", adminAuth, async (req, res) => {
  const { start, end } = req.query; //Obter as datas da rota ao invés do corpo da requisição

  //////////////////////mortes
  var amountQ = await Morte.findOne({
    attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
    where: {
      data: {
        [Op.between]: [start, end],
      },
    },
    raw: true,
  });
  var qmorte = Number(amountQ["sum(`quantidade`)"]);

  //////////////////////valor mortes
  var amountV = await Morte.findOne({
    attributes: [sequelize.fn("sum", sequelize.col("valor"))],
    where: {
      data: {
        [Op.between]: [start, end],
      },
    },
    raw: true,
  });
  var qvalor = Number(amountV["sum(`valor`)"]).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  Morte.findAll({
    include: [
      {
        model: Investidor,
      },
    ],
    where: {
      data: {
        [Op.between]: [start, end],
      },
    },
    order: [["createdAt", "DESC"]],
    raw: true,
    nest: true,
  })
    .then((mortes) => {
      mortes.forEach((morte) => {
        morte.data = moment(morte.data).format("DD/MM/YYYY");
      });
      Investidor.findAll({ order: [["name", "ASC"]] }).then((investidores) => {
        res.render("admin/estoque/morte", {
          mortes: mortes,
          investidores: investidores,
          qmorte,
          qvalor,
        });
      });
    })
    .catch((err) => {
      res.redirect("admin/estoque/morte");
    });
});

app.get("/relatorio/:id", adminAuth, async (req, res, next) => {
  var id = req.params.id;

  const page = parseInt(req.query.page) || 1;
  const limit = 10; // número de itens por página
  const offset = (page - 1) * limit;

  const investidores = await Investidor.findAll({
    order: [["name", "ASC"]],
    raw: true,
    nest: true,
  });
  const investidorNome = await Investidor.findOne({
    where: {
      id: id,
    },
    attributes: ["name"],
    raw: true,
    nest: true,
  }).then((result) => result.name);

  const { count, rows: contaCorrente } = await ContaCorrente.findAndCountAll({
    where: {
      investidoreId: id,
    },
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

  const compras = await Compra.findAll({
    where: {
      investidoreId: id,
    },
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
    where: {
      investidoreId: id,
    },
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

  var amountC = await Compra.findOne({
    attributes: [sequelize.fn("sum", sequelize.col("valor"))],
    where: {
      investidoreId: id,
    },
    raw: true,
  });
  var amountCompra = Number(amountC["sum(`valor`)"]).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const contaCorrentes = await ContaCorrente.findAll({
    where: {
      investidoreId: id,
      obs: "Crédito referente a venda de gado",
    },
    attributes: ["valor"],
  });

  let totalVendaSum = 0;
  contaCorrentes.forEach((contaCorrente) => {
    totalVendaSum += parseFloat(contaCorrente.valor);
  });

  const contaCorrentesEntrada = await ContaCorrente.findAll({
    where: {
      investidoreId: id,
      category: "ENTRADA",
    },
    attributes: ["valor"],
  });

  let totalSumEntrada = 0;
  contaCorrentesEntrada.forEach((contaCorrentesEntrada) => {
    totalSumEntrada += parseFloat(contaCorrentesEntrada.valor);
  });
  const contaCorrentesRetirada = await ContaCorrente.findAll({
    where: {
      investidoreId: id,
      category: "RETIRADA",
    },
    attributes: ["valor"],
  });

  let totalSumRetirada = 0;
  contaCorrentesRetirada.forEach((contaCorrentesRetirada) => {
    totalSumRetirada += parseFloat(contaCorrentesRetirada.valor);
  });

  totalSumRetirada = Math.abs(totalSumRetirada); // Converte para valor absoluto

  const amountCompraV = Number(amountC["sum(`valor`)"]);

  const mortes = await Morte.findAll({
    attributes: ["valor"],
    where: {
      investidoreId: id,
    },
    raw: true,
  });

  let sumMortes = 0;
  mortes.forEach((morte) => {
    sumMortes += parseFloat(morte.valor);
  });

  const Total =
    totalSumEntrada - amountCompraV + totalVendaSum - totalSumRetirada;

  var amountQ = await Morte.findOne({
    attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
    where: {
      investidoreId: id,
    },
    raw: true,
  });
  var morte = Number(amountQ["sum(`quantidade`)"]);

  var compradosTotal = await Compra.count({
    attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
    where: {
      investidoreId: id,
    },
  });

  var vendidos = await Venda.count({
    attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
    where: {
      investidoreId: id,
    },
  });

  //////////////////////estoque
  var estoque = compradosTotal - morte - vendidos;

  // Consultar o banco de dados para obter o último registro de Compra
  const lastCompra = await Compra.findOne({
    where: {
      investidoreId: id,
    },
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
  }

  mediaVenda = totalVendaSum / vendidos;

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
});
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.title = "error";
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
