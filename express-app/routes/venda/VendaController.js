const express = require('express');
const router = express.Router();
const Venda = require("./Venda");
const slugify = require("slugify");
const sequelize = require("sequelize");
const { Op } = require("sequelize");
const request = require('request')
const adminAuth = require("../../middlewares/adminAuth")

const Investidor = require("../investidor/Investidor")



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



router.get('/admin/venda',adminAuth, async (req, res, next) => {
  Venda.findAll({
    include: [{
      model: Investidor,
    }],
    order: [
      ["data", "DESC"]
    ],
     raw: true,
    nest: true,
  }).then((vendas) => {
    Investidor.findAll().then(async(investidores) => {
          //////////////////////Quantidade
    var amountQ = await Venda.findOne({
      attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
      
      raw: true
    });
    var quantidade = (Number(amountQ['sum(`quantidade`)']))
    
          //////////////////////Total Venda
          var amountT = await Venda.findOne({
            attributes: [sequelize.fn("sum", sequelize.col("total"))],
           
            raw: true
          });
          var TotalVenda = (Number(amountT['sum(`total`)'])).toLocaleFixed(2);
      
          
          //////////////////////Total Venda em dolar
    var amountD = await Venda.findOne({
      attributes: [sequelize.fn("sum", sequelize.col("amount"))],
     
      raw: true
    });
    var TotalVendaDolar = (Number(amountD['sum(`amount`)'])).toLocaleFixed(2);



      res.render('admin/venda/index', {
        vendas: vendas,
        investidores: investidores,
        quantidade, TotalVenda, TotalVendaDolar,
      });
    })
  })
});

router.get('/admin/venda/new', adminAuth, (req, res) => {

  
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
    res.render('admin/venda/new', {
      investidores: investidores,
      cotacao: cotacao,
      cotacaoDolar: cotacaoDolar
    });
  });
});

router.post('/venda/save', adminAuth, (req, res) => {
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

   Venda.create(
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
    res.redirect("/admin/venda");
  });
});

router.get("/admin/venda/edit/:id", adminAuth, (req, res) => {
  var id = req.params.id;

Venda.findByPk(id)
.then((venda) => {
  if (venda != undefined) {

    Investidor.findAll().then((investidores) => {
    res.render('admin/venda/edit', {
      venda: venda,
      investidores: investidores,
    })
  })
  } else{
    res.redirect('/admin/venda');
  }
})
.catch((err) => {
  res.redirect('/admin/venda');
})
})

router.post('/venda/update', adminAuth,(req, res) => {
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

  Venda.update({
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
    res.redirect("/admin/venda");
  })
  .catch((err) => {
    res.send("erro:" + err);
  });
})

router.post('/venda/delete',adminAuth, (req, res) => {
  var id = req.body.id;
  if (id != undefined) {
    if (!isNaN(id)) {
      Venda.destroy({
        where: {
          id: id,
        },
      }).then(() => {
        res.redirect("/admin/venda");
      });
    } else {
      // NÃO FOR UM NÚMERO
      res.redirect("/admin/venda");
    }
  } else {
    // NULL
    res.redirect("/admin/venda");
  }
});


module.exports = router;