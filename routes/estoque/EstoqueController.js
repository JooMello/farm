const express = require('express');
const router = express.Router();
const slugify = require("slugify");
const sequelize = require("sequelize");
const { Op } = require("sequelize");
const moment = require('moment');

const Investidor = require("../investidor/Investidor");
const Compra = require('../compra/Compra');
const Venda = require('../venda/Venda');
const Morte = require('../estoque/Estoque');
const adminAuth = require("../../middlewares/adminAuth")
const ContaCorrente = require("./../financeiro/contaCorrente/ContaCorrente")


router.get('/admin/estoque', adminAuth, async (req, res, next) => {
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
  var valor = Number(amountQ["sum(`valor`)"]).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  
    //////////////////////comprados
    var compradosTotal = await Compra.count();


  var comprados = await Compra.count({
    where: {
      status: "Em estoque",
    },
  });
  

  //////////////////////vendidos
  var vendidos = await Venda.count();

  //////////////////////estoque
  var estoque = compradosTotal - morte - vendidos;

  Compra.findAll({
    include: [
      {
        model: Investidor,
      },
    ],
  }).then((compras) => {
    Venda.findAll({
      include: [
        {
          model: Investidor,
        },
      ],
    }).then((vendas) => {
      Morte.findAll({
        include: [
          {
            model: Investidor,
          },
        ],
      }).then((mortes) => {
        Investidor.findAll().then(async (investidores) => {
          //////////////////////Capital Investidor
          var amountC = await Compra.findOne({
            attributes: [sequelize.fn("sum", sequelize.col("valor"))],
            where: {
              status: "Em estoque",
            },
            raw: true,
          });

          var amountV = await Venda.findOne({
            attributes: [sequelize.fn("sum", sequelize.col("valor"))],

            raw: true,
          });
           var TotalCompra = Number(amountC["sum(`valor`)"]);
           var TotalV = Number(amountV["sum(`valor`)"]) /2;
           const Totalf = (TotalCompra - TotalV);
          var Total = Totalf.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });

          var capitalInvestido = await Compra.findOne({
            attributes: [sequelize.fn("sum", sequelize.col("valor"))],
            
            raw: true,
          });
          var TotalcapitalInvestido = Number(capitalInvestido["sum(`valor`)"]);
          var TotalC = TotalcapitalInvestido.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });




 // Consultar o banco de dados para obter o último registro de Compra
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
}
        
            const compras = await Compra.findAll(); // Busca todas as compras
            const mortes = await Morte.findAll(); // Busca todas as compras

            mortes.forEach(morte => {
              morteVal = parseFloat(morte.valor); // Converte o valor para um número
              morteQuant = parseFloat(morte.quantidade); // Converte a quantidade para um número

            });
        



          var CapitalEstoque = (Totalf - valorf).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });
          res.render("admin/estoque/index", {
            compras: compras,
            vendas: vendas,
            mortes: mortes,
            valor: valor,
            Total,
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
        });
      });
    });
  });
});

router.get('/admin/estoque/newMorte', adminAuth, async (req, res) => {
  const amountQ = await Morte.findOne({
    attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
    raw: true,
  });



  // Consultar o banco de dados para obter o último registro de Compra
  const lastCompra = await Compra.findOne({
    order: [["createdAt", "DESC"]],
  });
      // Obter o valor de mediaPonderada do último registro
      const MediaCompraPonderada = lastCompra.mediaPonderada;

  
  Compra.findAll({
    where: {
      status: "Em estoque",
      brinco: {
      [Op.not]: null, // Garante que o valor do brinco não seja nulo
      [Op.ne]: ""    // Garante que o valor do brinco não seja vazio
    }
    }
  }).then((compras) => {
    Investidor.findAll().then((investidores) => {
      res.render('admin/estoque/newMorte', {
        compras: compras,
        investidores: investidores,
        MediaCompraPonderada,
      });
    });
  });
  });

  router.post('/morte/save', adminAuth, async (req, res) => {
    var data = req.body.data;
    var quantidade = req.body.quantidade;
    var valor = req.body.valor;
    var brinco = req.body.brinco;
    var peso = req.body.peso;
    var investidor = req.body.investidor;

    console.log("Dados recebidos:");
    console.log("Data:", data);
    console.log("Quantidade:", quantidade);
    console.log("Valor:", valor);
    console.log("Brinco:", brinco);
    console.log("Peso:", peso);
    console.log("Investidor:", investidor);

    let valorFloat = parseFloat(
        valor.replace("R$", "").replace(".", "").replace(",", ".")
    );

    try {
        const objects = [];

        for (let i = 0; i < quantidade; i++) {
            let brincoValue = (brinco && brinco[i]) ? brinco[i] : null;

            objects.push({
                data: data,
                quantidade: 1,
                valor: valorFloat,
                brinco: brincoValue,
                peso: peso[i],
                investidoreId: investidor,
            });

            if (brincoValue) {
                await Compra.update(
                    { status: "Morto" },
                    { where: { brinco: brincoValue } }
                );
            }
        }

        await Morte.bulkCreate(objects);
        res.redirect("/admin/estoque/morte");
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao salvar os registros no banco de dados" });
    }
});


router.get('/admin/estoque/morte', adminAuth, async (req, res, next) => {

    //////////////////////mortes
    var amountQ = await Morte.findOne({
      attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
      raw: true
    });
    var qmorte = (Number(amountQ['sum(`quantidade`)']))

        //////////////////////valor mortes
        var amountV = await Morte.findOne({
          attributes: [sequelize.fn("sum", sequelize.col("valor"))],
          raw: true
        });
        var qvalor = (Number(amountV['sum(`valor`)'])).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

    Morte.findAll({
      include: [{
          model: Investidor,
        }],
        order: [
          ["data", "DESC"]
        ],
        raw: true,
        nest: true,
    }).then((mortes) => {
      Compra.findAll({
        include: [{
            model: Investidor,
          }],
          order: [
            ["data", "DESC"]
          ],
          raw: true,
          nest: true,
      }).then((compras) => {
        mortes.forEach((morte) => {
          morte.data = moment(morte.data).format('DD/MM/YYYY');
        });
    Investidor.findAll().then((investidores) => {
      res.render('admin/estoque/morte', {
        mortes: mortes,
        compras: compras,
        investidores: investidores,
        qmorte,
        qvalor,
      });
    })
})
});
})

router.post('/morte/delete', adminAuth, (req, res) => {
  var id = req.body.id;
  if (id != undefined) {
    if (!isNaN(id)) {
      Morte.destroy({
        where: {
          id: id,
        },
      }).then(() => {
        res.redirect("/admin/estoque/morte");
      });
    } else {
      // NÃO FOR UM NÚMERO
      res.redirect("/admin/estoque/morte");
    }
  } else {
    // NULL
    res.redirect("/admin/estoque/morte");
  }
});

router.get("/admin/estoque/edit/:id", adminAuth, (req, res) => {
  var id = req.params.id;

Morte.findByPk(id)
.then((morte) => {
  if (morte != undefined) {

    Investidor.findAll().then((investidores) => {
    res.render('admin/estoque/edit', {
      morte: morte,
      investidores: investidores,
    })
  })
  } else{
    res.redirect('/admin/estoque/morte');
  }
})
.catch((err) => {
  res.redirect('/admin/estoque/morte');
})
})

router.post('/morte/update', adminAuth, (req, res) => {
  var id = req.body.id;
  var data = req.body.data;
  var quantidade = req.body.quantidade;
  var valor = req.body.valor;
  var investidor = req.body.investidor;

    let valorFloat = parseFloat(
      valor.replace("R$", "").replace(".", "").replace(",", ".")
    );

  Morte.update({
    data: data,
    quantidade: quantidade,
    valor: valorFloat,
    investidoreId: investidor,
  }, {
    where: {
      id: id,
    }
  })
  .then(() => {
    res.redirect("/admin/estoque/morte");
  })
  .catch((err) => {
    res.send("erro:" + err);
  });
})


module.exports = router;
