const express = require('express');
const router = express.Router();
const Venda = require("./Venda");
const slugify = require("slugify");
const sequelize = require("sequelize");
const { Op } = require("sequelize");
const request = require('request')
const adminAuth = require("../../middlewares/adminAuth")
var fs = require("fs");
const moment = require('moment');

const Investidor = require("../investidor/Investidor")

const accountSid = "AC00fbbfc768402c07243ec830f4e3c2d8";
const authToken = "c49b7d7775ef24875c1a6e330bfc1c16";
const client = require("twilio")(accountSid, authToken);


const { host, port, user, pass } = require('../../config/mail.json');


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
      vendas.forEach((venda) => {
        venda.data = moment(venda.data).format('DD/MM/YYYY');
      });
          //////////////////////Quantidade
    var amountQ = await Venda.findOne({
      attributes: [sequelize.fn("sum", sequelize.col("quantidade"))],
      
      raw: true
    });
    var quantidade = (Number(amountQ['sum(`quantidade`)']))
    
          //////////////////////valor Venda
          var amountT = await Venda.findOne({
            attributes: [sequelize.fn("sum", sequelize.col("valor"))],
           
            raw: true
          });
          var ValorVenda = (Number(amountT['sum(`valor`)'])).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
      
          
          //////////////////////valor Venda em dolar
    var amountD = await Venda.findOne({
      attributes: [sequelize.fn("sum", sequelize.col("amount"))],
     
      raw: true
    });
    var TotalVendaDolar = (Number(amountD['sum(`amount`)'])).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
      res.render('admin/venda/index', {
        vendas: vendas,
        investidores: investidores,
        quantidade, ValorVenda, TotalVendaDolar,
      });
    })
  })
});

router.get('/admin/venda/new', adminAuth,(req, res) => {

  var cotacaoDolar = Number(cotacao).toLocaleString('en-US', {style: 'currency', currency: 'USD'});

  Investidor.findAll().then((investidores) => {
    res.render('admin/venda/new', {
      investidores: investidores,
      cotacao: cotacao,
      cotacaoDolar: cotacaoDolar
    });
  });
});

router.post('/venda/save', adminAuth,async (req, res) => {
  let id = req.body.id;
  let code = req.body.code;
  let data = req.body.data;
  let quantidade = req.body.quantidade;
  let valor = req.body.valor;
  let dolar = req.body.dolar;
  let amount = req.body.amount;
  let obs = req.body.obs;
  let investidor = req.body.investidor;

  let valorFloat = parseFloat(valor.replace("R$", "").replace(".", "").replace(",", "."));
  let dolarFloat = parseFloat(dolar.replace("$", ""));
  let amountFloat = parseFloat(amount.replace("$", "").replace(",", ".").replace(".", ""));

  if (!id) {
    try {
      const venda = await Venda.findOne({
        order: [['id', 'DESC']],
        limit: 1
      });
      nextId = venda ? venda.id + 1 : 1;
    } catch (error) {
      // Tratar o erro de consulta
      console.error(error);
      nextId = 1;
    }
  } else {
    nextId = parseInt(id) + 1;
  }

  if (!code) {
    try {
      const lastVenda = await Venda.findOne({
        order: [['code', 'DESC']],
        limit: 1
      });
  
      if (lastVenda) {
        const lastCode = lastVenda.code.toString();
        const incrementedCode = (parseInt(lastCode) + 1).toString();
        nextCode = parseInt(incrementedCode);
      } else {
        nextCode = 1;
      }
    } catch (error) {
      // Tratar o erro de consulta
      console.error(error);
      nextCode = 1;
    }
  } else {
    nextCode = parseInt(code); // Não incrementar o código fornecido
  }
  
  insertVenda(nextId, nextCode)

  function insertVenda(nextId, nextCode) {
    var objects = [];

    for (var i = 0; i < quantidade; i++) {
      objects.push({
        id: nextId,
        data: data,
        quantidade: quantidade,
        code: nextCode,
        valor: valorFloat / quantidade,
        dolar: dolarFloat,
        amount: amountFloat / quantidade,
        obs: obs,
        investidoreId: investidor,
      });
      nextId++; // Incrementar o ID para o próximo objeto
    }

    Venda.bulkCreate(objects).then(() => {
      res.redirect("/admin/venda");
    });
  }
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
  var valor = req.body.valor;
  var dolar = req.body.dolar;
  var amount = req.body.amount;
  var obs = req.body.obs;
  var investidor = req.body.investidor;

  var valorFloat = valor.replace(".", "").replace(",", ".");
  var amountFloat = amount.replace("$", "");

  Venda.update(
    {
      data: data,
      quantidade: quantidade,
      valor: valorFloat,
      dolar: dolar,
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
      // Formata a data para o padrão "DD/MM/YYYY"
      var dataFormatada = moment(data, "YYYY-MM-DD").format("DD/MM/YYYY");
      var valorFormatado = Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });

      // Enviar mensagem no WhatsApp quando a página inicial for acessada
      client.messages
        .create({
          from: "whatsapp:+14155238886",
          to: "whatsapp:+556593589187",
          body: `Olá, essa é uma mensagem de notificação:
    Venda de Gado foi editado para
    Data: ${dataFormatada}
    Valor: ${valorFormatado}`,
        })
        .then((message) => console.log(message.sid));
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
                // Enviar mensagem no WhatsApp quando a página inicial for acessada
        client.messages
          .create({
            from: "whatsapp:+14155238886",
            to: "whatsapp:+556593589187",
            body: `Olá, essa é uma mensagem de notificação:
    Uma Venda de Gado foi excluida`,
          })
          .then((message) => console.log(message.sid));
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