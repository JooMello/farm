const express = require('express');
const router = express.Router();
const Compra = require("./Compra");
const slugify = require("slugify");
const sequelize = require("sequelize");
const { Op } = require("sequelize");
const request = require('request')

const Investidor = require("../investidor/Investidor")



//filtragem de dados, por peridodo que eles foram adicionados no BD
  //formatar numeros em valores decimais (.toLocaleFixed(2))
  Number.prototype.toLocaleFixed = function (n) {
    return this.toLocaleString(undefined, {
      minimumFractionDigits: n,
      maximumFractionDigits: n
    });
  };

// https://docs.awesomeapi.com.br/

const moedas =  'USD-BRL'

// request{options, callback}


const options = {
    url: `https://economia.awesomeapi.com.br/last/${moedas}`,
    method: 'GET',
    headers: {
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8'
    },
}

const callback_dolar = function(erro, res, body){
    let json = JSON.parse(body)
    cotacao = json.USDBRL['bid']
}
const Dolar = request(options, callback_dolar)


router.get('/admin/compra', async (req, res, next) => {
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
    Investidor.findAll().then(async(investidores) => {

         //////////////////////Quantidade
    var amountQ = await Compra.findOne({
      attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
      
      raw: true
    });
    var quantidade = (Number(amountQ['sum(`quantidade`)']))
    
          //////////////////////Capital Investidor
          var amountT = await Compra.findOne({
            attributes: [sequelize.fn("sum", sequelize.col("total"))],
           
            raw: true
          });
          var CapitalInvestido = (Number(amountT['sum(`total`)'])).toLocaleFixed(2);
      
          
          //////////////////////Capital Investidor em dolar
    var amountD = await Compra.findOne({
      attributes: [sequelize.fn("sum", sequelize.col("amount"))],
     
      raw: true
    });
    var CapitalInvestidoDolar = (Number(amountD['sum(`amount`)'])).toLocaleFixed(2);



      res.render('admin/compra/index', {
        compras: compras,
        investidores: investidores,
        quantidade, CapitalInvestido, CapitalInvestidoDolar,
      });
    })
  })
});

router.get('/admin/compra/new', (req, res) => {

    //filtragem de dados, por peridodo que eles foram adicionados no BD
  //formatar numeros em valores decimais (.toLocaleFixed(2))
  Number.prototype.toLocaleFixed = function (n) {
    return this.toLocaleString(undefined, {
      minimumFractionDigits: n,
      maximumFractionDigits: n
    });
  };

  var cotacaoDolar = (Number(cotacao)).toLocaleFixed(2);

  Investidor.findAll().then((investidores) => {
    res.render('admin/compra/new', {
      investidores: investidores,
      cotacao: cotacao,
      cotacaoDolar: cotacaoDolar
    });
  });
});

router.post('/compra/save',  (req, res) => {
  var data = req.body.data;
  var quantidade = req.body.quantidade;
  var unitario = req.body.unitario;
  var total = req.body.total;
  var dolar = req.body.dolar;
  var amount = req.body.amount;
  var investidor = req.body.investidor;

  var unitarioFloat = unitario.replace(".", "").replace(",", ".")
  var totalFloat = total.replace(".", "").replace(",", ".")
  var dolarFloat = dolar.replace(".", "").replace(",", ".")
  var amountFloat = amount.replace(".", "").replace(",", ".")


   Compra.create(
   {
    data: data,
    quantidade: quantidade,
    unitario: unitarioFloat,
    total: totalFloat,
    dolar: dolarFloat,
    amount: amountFloat,
    investidoreId: investidor
  })
  .then(() => {
    res.redirect("/admin/compra");
  });
});

router.get("/admin/compra/edit/:id", (req, res) => {
  var id = req.params.id;

Compra.findByPk(id)
.then((compra) => {
  if (compra != undefined) {

    Investidor.findAll().then((investidores) => {
    res.render('admin/compra/edit', {
      compra: compra,
      investidores: investidores,
    })
  })
  } else{
    res.redirect('/admin/compra');
  }
})
.catch((err) => {
  res.redirect('/admin/compra');
})
})

router.post('/compra/update', (req, res) => {
  var id = req.body.id;
  var data = req.body.data;
  var quantidade = req.body.quantidade;
  var unitario = req.body.unitario;
  var total = req.body.total;
  var dolar = req.body.dolar;
  var amount = req.body.amount;
  var investidor = req.body.investidor;

  var unitarioFloat = unitario.replace(".", "").replace(",", ".")
  var totalFloat = total.replace(".", "").replace(",", ".")
  var amountFloat = amount.replace(".", "").replace(",", ".")

  Compra.update({
    data: data,
    quantidade: quantidade,
    unitario: unitarioFloat,
    total: totalFloat,
    dolar: dolar,
    amount: amountFloat,
    investidoreId: investidor,
  }, {
    where: {
      id: id,
    }
  })
  .then(() => {
    res.redirect("/admin/compra");
  })
  .catch((err) => {
    res.send("erro:" + err);
  });
})

router.post('/compra/delete', (req, res) => {
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
    } else {
      // NÃO FOR UM NÚMERO
      res.redirect("/admin/compra");
    }
  } else {
    // NULL
    res.redirect("/admin/compra");
  }
});


module.exports = router;
