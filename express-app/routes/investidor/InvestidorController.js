const express = require('express');
const router = express.Router();
const Investidor = require("./Investidor");
const slugify = require("slugify");
const sequelize = require("sequelize");
const adminAuth = require("../../middlewares/adminAuth")
const {
  Op
} = require("sequelize");

const Compra = require("../compra/Compra");
const Venda = require("../venda/Venda");
const Saque = require('./Saque');
const DC = require("../debitoCredito/DC");

var app = express();

//filtragem de dados, por peridodo que eles foram adicionados no BD
  //formatar numeros em valores decimais (.toLocaleFixed(2))
  Number.prototype.toLocaleFixed = function (n) {
    return this.toLocaleString(undefined, {
      minimumFractionDigits: n,
      maximumFractionDigits: n
    });
  };

router.get('/admin/investidor', adminAuth, (req, res, next) => {

  Investidor.findAll({
    order: [
      ["createdAt", "DESC"]
    ],
     raw: true,
    nest: true,
  }).then((investidores) => {
    res.render('admin/investidor/index', {
      investidores,
    });
  })
});

router.get('/admin/investidor/new', adminAuth, (req, res, next) => {
  Investidor.findAll().then((investidores) => {
    res.render('admin/investidor/new', {
      investidores,
    });
  })
})

router.post('/investidor/save', adminAuth, (req, res, next) => {
  var name = req.body.name;
  var phone = req.body.phone;
  var email = req.body.email;
  var cpf = req.body.cpf;
  var cep = req.body.cep;
  var logradouro = req.body.logradouro;
  var uf = req.body.uf;
  var cidade = req.body.cidade;
  var number = req.body.number;
  var obs = req.body.obs;

  Investidor.create({
    name: name,
    slug: slugify(name),
    phone: phone,
    email: email,                                                                          
    cpf: cpf,
    cep: cep,
    logradouro: logradouro,
    uf: uf,
    cidade: cidade,
    number: number,
    obs: obs,
  })
  .then(() => {
    res.redirect("/admin/investidor");
  });
});

router.get("/admin/investidor/edit/:id", adminAuth, (req, res) => {
  var id = req.params.id;

Investidor.findByPk(id)
.then((investidor) => {
  if (investidor != undefined) {
    res.render('admin/investidor/edit', {
      investidor,
    })
  } else{
    res.redirect('/');
  }
})
.catch((err) => {
  res.redirect('/');
})
})

router.post('/investidor/update', adminAuth, (req, res) => {
  var id = req.body.id;
  var name = req.body.name;
  var phone = req.body.phone;
  var email = req.body.email;
  var cpf = req.body.cpf;
  var cep = req.body.cep;
  var logradouro = req.body.logradouro;
  var uf = req.body.uf;
  var cidade = req.body.cidade;
  var number = req.body.number;
  var obs = req.body.obs;

  Investidor.update({
    name: name,
    slug: slugify(name),
    phone: phone,
    email: email,
    cpf: cpf,
    cep: cep,
    logradouro: logradouro,
    uf: uf,
    cidade: cidade,
    number: number,
    obs: obs,
  }, {
    where: {
      id: id,
    }
  })
  .then(() => {
    res.redirect("/admin/investidor");
  })
  .catch((err) => {
    res.send("erro:" + err);
  });
})

router.post('/investidor/delete',adminAuth,  (req, res) => {
  var id = req.body.id;
  if (id != undefined) {
    if (!isNaN(id)) {
      Investidor.destroy({
        where: {
          id: id,
        },
      }).then(() => {
        res.redirect("/admin/investidor");
      });
    } else {
      // NÃO FOR UM NÚMERO
      res.redirect("/admin/investidor");
    }
  } else {
    // NULL
    res.redirect("/admin/investidor");
  }
});

//Investidores 
router.get('/investidor/:id',adminAuth,  (req, res) => {
    var id = req.params.id;
    
        Investidor.findAll({
            where:{
          id: id,
        },
         include: [{
          model: Venda
        },{
          model: Compra
        },{
          model: Saque
        },{
          model: DC
        },],
        raw: true,
        nest: true,
        }).then((investidores) => {
          Investidor.findByPk(id)
.then( async (investidor) => {

            /////Valor da Venda
  var amountVv = await Venda.findOne({
      attributes: [sequelize.fn("sum", sequelize.col("total"))],
      where: {
        investidoreId: id,
      },
      raw: true
    });
  var amountVT = (Number(amountVv['sum(`total`)']))

            //////////////////////Capital Investidor
  var amountT = await Compra.findOne({
              attributes: [sequelize.fn("sum", sequelize.col("total"))],
              where: {
                investidoreId: id,
              },
              raw: true
            });
  var CapitalInvestidoT = (Number(amountT['sum(`total`)']))
  var CapitalInvestido = (Number(amountT['sum(`total`)'])).toLocaleFixed(2);

             ///Lucro sobre Investimento
  var LucroN = (Number(amountVT) - Number(CapitalInvestidoT));
  var Lucro = (Number(amountVT) - Number(CapitalInvestidoT)).toLocaleFixed(2);

      //////////////////////Capital Retirado
  var amountR = await Saque.findOne({
        attributes: [sequelize.fn("sum", sequelize.col("valor"))],
        where: {
          investidoreId: id,
        },
        raw: true
      });
  var CapitalRetiradoT = (Number(amountR['sum(`valor`)']))
  var CapitalRetirado = (Number(amountR['sum(`valor`)'])).toLocaleFixed(2);

      //////////////////////Capital Investidor
      var amountDC = await DC.findOne({
        attributes: [sequelize.fn("sum", sequelize.col("valor"))],
        where: {
          investidoreId: id,
        },
        raw: true
      });
      var debitoCreditoD = (Number(amountDC['sum(`valor`)']))
      var debitoCredito = (Number(amountDC['sum(`valor`)'])).toLocaleFixed(2);

      /////total
  var total = (Number(CapitalInvestidoT) + Number(LucroN) + Number(debitoCreditoD) - Number(CapitalRetiradoT)).toLocaleFixed(2);


      res.render("admin/investidor/investidor",{
        investidores: investidores,
        investidor: investidor,
        CapitalInvestido, Lucro, CapitalRetirado, total, debitoCredito,
      })
  })
})
});

router.get('/admin/investidor/newR/:id', adminAuth, (req, res, next) => {

  var id = req.params.id;

  Investidor.findAll().then((investidores) => {

    Investidor.findByPk(id)
    .then((investidor) => {
    res.render('admin/investidor/newR', {
      investidores: investidores,
      investidor: investidor,
    });
  })
  })
})

router.post('/saque/save', adminAuth,  (req, res) => {
  var id = req.params.id;
  var data = req.body.data;
  var valor = req.body.valor;
  var investidor = req.body.investidor;
  var valorFloat = valor.replace(".", "").replace(",", ".")

  Saque.create(
   {
    data: data,
    valor: valorFloat,
    investidoreId: investidor,
  })
  .then(() => {
    res.redirect("/admin/investidor");
  });
});

//Investidores 
router.get('/admin/investidor/saque/:id',adminAuth,  (req, res) => {
  var id = req.params.id;
      Investidor.findAll().then((investidores) => {
        Saque.findAll({
          where:{
            investidoreId: id,
          },
          include: [{
            model: Investidor,
          }],
          order: [
            ["createdAt", "DESC"]
          ],
           raw: true,
          nest: true,
        }).then((saques) => {
        Investidor.findByPk(id)
.then( async (investidor) => {
    res.render("admin/investidor/saque",{
      investidores: investidores,
      investidor: investidor,
      saques: saques,
    })
})
        })
})
});


router.get("/admin/investidor/editSaque/:id", adminAuth,  (req, res) => {
  var id = req.params.id;

  Saque.findByPk(id)
  .then((saque) => {
    if (saque != undefined) {

      Investidor.findAll().then((investidores) => {
        res.render('admin/investidor/editSaque', {
          saque: saque,
          investidores: investidores,
        })
      })
      } else{
        res.redirect('/admin/investidor/editSaque/:id');
      }
    })
    .catch((err) => {
      res.redirect('/admin/investidor/editSaque/:id');
    })
})


router.post('/saque/update',adminAuth, (req, res) => {
  var id = req.body.id;
  var data = req.body.data;
  var valor = req.body.valor;
  var investidor = req.body.investidor;

  var valorFloat = valor.replace(".", "").replace(",", ".")

  Saque.update({
    data: data,
    valor: valorFloat,
    investidoreId: investidor
  }, {
    where: {
      id: id,
    }
  })
  .then(() => {
    res.redirect("/admin/investidor");
  })
  .catch((err) => {
    res.send("erro:" + err);
  });
})

router.post('/saque/delete',adminAuth,  (req, res) => {
  var id = req.body.id;
  if (id != undefined) {
    if (!isNaN(id)) {
      Saque.destroy({
        where: {
          id: id,
        },
      }).then(() => {
        res.redirect("/admin/investidor");
      });
    } else {
      // NÃO FOR UM NÚMERO
      res.redirect("/admin/investidor");
    }
  } else {
    // NULL
    res.redirect("/admin/investidor");
  }
});



module.exports = router;


