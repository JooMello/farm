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
const moment = require('moment');

var investidorRouter = require("./routes/investidor/InvestidorController");
var compraRouter = require("./routes/compra/CompraController");
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
const ContaCorrente = require("./routes/financeiro/ContaCorrente/ContaCorrente");

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
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", routes);
app.use("/", investidorRouter);
app.use("/", compraRouter);
app.use("/", vendaRouter);
app.use("/", relatorioRouter);
app.use("/", estoqueRouter);
app.use("/", contaCorrenteRouter);
app.use("/", userRouter);


connection
  .authenticate()
  .then(() => {
    console.log("Conexão feita com sucesso!");
  })
  .catch((error) => {
    console.log(error);
  });

//Compra
app.get("/compra/:id", adminAuth, (req, res) => {
  var id = req.params.id;
  Compra.findAll({
    include: [
      {
        model: Investidor,
      },
    ],
    where: {
      investidoreId: id,
    },
    order: [["data", "DESC"]],
    raw: true,
    nest: true,
  })
    .then((compras) => {
      compras.forEach((compra) => {
        compra.data = moment(compra.data).format('DD/MM/YYYY');
      });
      Investidor.findAll().then(async (investidores) => {
        //////////////////////Quantidade
        var amountQ = await Compra.findOne({
          attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
          where: {
            investidoreId: id,
          },
          raw: true,
        });
        var quantidade = Number(amountQ["sum(`quantidade`)"]);

        //////////////////////Capital Investidor
        var amountT = await Compra.findOne({
          attributes: [sequelize.fn("sum", sequelize.col("valor"))],
          where: {
            investidoreId: id,
          },
          raw: true,
        });
        var CapitalInvestido = Number(amountT["sum(`valor`)"]).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

          //////////////////////média valor
          var amounC = await Compra.findOne({
            attributes: [sequelize.fn("avg", sequelize.col("valor"))],
            where: {
              investidoreId: id,
            },
            raw: true
          });
          var mediaCompra = (Number(amounC['avg(`valor`)'])).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

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
        ).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

        res.render("admin/compra/index", {
          investidores: investidores,
          compras: compras,
          quantidade, mediaCompra,
          CapitalInvestido,
          CapitalInvestidoDolar,
        });
      });
    })
    .catch((err) => {
      res.redirect("admin/compra/index");
    });
});

//Venda
app.get("/venda/:id", adminAuth, (req, res) => {
  var id = req.params.id;
  Venda.findAll({
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
    .then((vendas) => {
      Investidor.findAll().then(async (investidores) => {
        //////////////////////Quantidade
        var amountQ = await Venda.findOne({
          attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
          where: {
            investidoreId: id,
          },
          raw: true,
        });
        var quantidade = Number(amountQ["sum(`quantidade`)"]);

        //////////////////////valor Venda
        var amountT = await Venda.findOne({
          attributes: [sequelize.fn("sum", sequelize.col("valor"))],
          where: {
            investidoreId: id,
          },
          raw: true,
        });
        var ValorVenda = Number(amountT["sum(`valor`)"]).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

        //////////////////////Total Venda em dolar
        var amountD = await Venda.findOne({
          attributes: [sequelize.fn("sum", sequelize.col("amount"))],
          where: {
            investidoreId: id,
          },
          raw: true,
        });
        var TotalVendaDolar = Number(amountD["sum(`amount`)"]).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

        res.render("admin/venda/index", {
          investidores: investidores,
          vendas: vendas,
          quantidade,
          ValorVenda,
          TotalVendaDolar,
        });
      });
    })
    .catch((err) => {
      res.redirect("admin/venda/index");
    });
});

app.get("/contaCorrente/:id", adminAuth, async (req, res, next) => {
  var id = req.params.id;
  Investidor.findAll({
    raw: true,
    nest: true,
  }).then(async (investidores) => {
     ContaCorrente.findAll({
       include: [
         {
           model: Investidor,
         },
       ],
       where: {
        investidoreId: id,
      },
       order: [["data", "DESC"]],
       raw: true,
       nest: true,
     }).then(async (contaCorrente) => {
      var amountT = await ContaCorrente.findOne({
        attributes: [sequelize.fn("sum", sequelize.col("valor"))],
        where: {
          investidoreId: id,
        },
        raw: true,
      });
      var Total = Number(amountT["sum(`valor`)"]).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
           res.render("admin/financeiro/contaCorrente/index", {
             investidores: investidores,
             contaCorrente: contaCorrente,
             Total,
           });
         });
       });
     });

//Relatório id
app.get("/relatorio/:id", adminAuth, async (req, res) => {
  var id = req.params.id;
  Investidor.findOne({
    where: {
      id: id,
    },
    include: [
      {
        model: Venda,
      },
      {
        model: Compra,
      },
    ],
  })
    .then((investidor) => {
      if (investidor != undefined) {
        Investidor.findAll().then(async (investidores) => {
          //////////////////////Quantidade
          var amountQ = await Venda.findOne({
            attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
            where: {
              investidoreId: id,
            },
            raw: true,
          });
          var quantidade = Number(amountQ["sum(`quantidade`)"]);

          //////////////////////média valor
          var amountU = await Venda.findOne({
            attributes: [sequelize.fn("avg", sequelize.col("valor"))],
            where: {
              investidoreId: id,
            },
            raw: true,
          });
          var unitarioT = Number(amountU["avg(`valor`)"]);
          var unitario = Number(amountU["avg(`valor`)"]).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

          /////Valor da Venda
          var amountVv = await Venda.findOne({
            attributes: [sequelize.fn("sum", sequelize.col("valor"))],
            where: {
              investidoreId: id,
            },
            raw: true,
          });
          var amountVT = Number(amountVv["sum(`valor`)"]);
          var amountV = Number(amountVv["sum(`valor`)"]).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

          //////////////////////Capital Investidor
          var amountT = await Compra.findOne({
            attributes: [sequelize.fn("sum", sequelize.col("valor"))],
            where: {
              investidoreId: id,
            },
            raw: true,
          });
          var CapitalInvestidoT = Number(amountT["sum(`valor`)"]);
          var CapitalInvestido = Number(amountT["sum(`valor`)"]).toLocaleFixed(
            2
          );

          ///Investimento sobre a Venda
          var InvVenda = (
            (Number(CapitalInvestidoT) / Number(amountVT)) *
            100
          ).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

          ///Lucro sobre Investimento
          var LucroN = Number(amountVT) - Number(CapitalInvestidoT);
          var Lucro = (
            Number(amountVT) - Number(CapitalInvestidoT)
          ).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

          ///Lucro sobre investimento Fazenda
          var LucroFN = Number(LucroN) / 2;
          var LucroF = (Number(LucroN) / 2).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

          //Percentual Fazenda
          var percentualF = (
            (Number(LucroFN) / Number(LucroN)) *
            100
          ).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

          res.render("admin/relatorios/index", {
            vendas: investidor.vendas,
            compra: investidor.compras,
            investidores: investidores,
            quantidade,
            unitario,
            amountV,
            CapitalInvestido,
            InvVenda,
            Lucro,
            LucroF,
            percentualF,
          });
        });
      } else {
        res.redirect("admin/relatorios/index");
      }
    })
    .catch((err) => {
      res.redirect("admin/relatorios/index");
    });
});

//Relatório data
app.get("/relatorio/:data", adminAuth, async (req, res) => {
  var id = req.params.id;
  var data = req.params.data;
  Investidor.findOne({
    where: {
      id: id,
    },
    include: [
      {
        model: Venda,
      },
      {
        model: Compra,
      },
    ],
  })
    .then((investidor) => {
      if (investidor != undefined) {
        Investidor.findAll().then(async (investidores) => {
          //////////////////////Quantidade
          var amountQ = await Venda.findOne({
            attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
            where: {
              data: data,
            },
            raw: true,
          });
          var quantidade = Number(amountQ["sum(`quantidade`)"]);

          //////////////////////Unitário
          var amountU = await Venda.findOne({
            attributes: [sequelize.fn("avg", sequelize.col("unitario"))],
            where: {
              data: data,
            },
            raw: true,
          });
          var unitarioT = Number(amountU["avg(`unitario`)"]);
          var unitario = Number(amountU["avg(`unitario`)"]).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

          /////Valor da Venda
          var amountVv = await Venda.findOne({
            attributes: [sequelize.fn("sum", sequelize.col("total"))],
            where: {
              data: data,
            },
            raw: true,
          });
          var amountVT = Number(amountVv["sum(`valor`)"]);
          var amountV = Number(amountVv["sum(`valor`)"]).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

          //////////////////////Capital Investidor
          var amountT = await Compra.findOne({
            attributes: [sequelize.fn("sum", sequelize.col("valor"))],
            where: {
              data: data,
            },
            raw: true,
          });
          var CapitalInvestidoT = Number(amountT["sum(`valor`)"]);
          var CapitalInvestido = Number(amountT["sum(`valor`)"]).toLocaleFixed(
            2
          );

          ///Investimento sobre a Venda
          var InvVenda = (
            (Number(CapitalInvestidoT) / Number(amountVT)) *
            100
          ).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

          ///Lucro sobre Investimento
          var LucroN = Number(amountVT) - Number(CapitalInvestidoT);
          var Lucro = (
            Number(amountVT) - Number(CapitalInvestidoT)
          ).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

          ///Lucro sobre investimento Fazenda
          var LucroFN = Number(LucroN) / 2;
          var LucroF = (Number(LucroN) / 2).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

          //Percentual Fazenda
          var percentualF = (
            (Number(LucroFN) / Number(LucroN)) *
            100
          ).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

          res.render("admin/relatorios/index", {
            vendas: investidor.vendas,
            compra: investidor.compras,
            investidores: investidores,
            quantidade,
            unitario,
            amountV,
            CapitalInvestido,
            InvVenda,
            Lucro,
            LucroF,
            percentualF,
          });
        });
      } else {
        res.redirect("admin/relatorios/index");
      }
    })
    .catch((err) => {
      res.redirect("admin/relatorios/index");
    });
});

//Estoque
app.get("/estoque/:id", adminAuth, async (req, res) => {
  var id = req.params.id;

  await Morte.findOne({
    attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
    where: {
      investidoreId: id,
    },
    raw: true,
  })
    .then(async (amountQ) => {
      let morte = Number(amountQ["sum(`quantidade`)"]);
      await Compra.findOne({
        attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
        where: {
          investidoreId: id,
        },
        raw: true,
      }).then(async (amountQc) => {
        let comprados = Number(amountQc["sum(`quantidade`)"]);
        await Venda.findOne({
          attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
          where: {
            investidoreId: id,
          },
          raw: true,
        }).then((amountQv) => {
          let vendidos = Number(amountQv["sum(`quantidade`)"]);

          var estoque = comprados - morte - vendidos;

          Investidor.findAll().then((investidores) => {
            res.render("admin/estoque/index", {
              investidores: investidores,
              morte,
              comprados,
              vendidos,
              estoque,
            });
          });
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
        var amountQ = await Morte.findOne({
          attributes: [sequelize.fn("sum", sequelize.col("valor"))],
          where: {
            investidoreId: id,
          },
          raw: true
        });
        var qvalor = (Number(amountQ['sum(`valor`)']))

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
      Investidor.findAll().then((investidores) => {
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
