const express = require('express');
const router = express.Router();
const slugify = require("slugify");
const sequelize = require("sequelize");
const { Op } = require("sequelize");

const Investidor = require("../investidor/Investidor");
const Compra = require('../compra/Compra');
const Venda = require('../venda/Venda');
const DC = require('./DC');


router.get('/admin/dc', async (req, res, next) => {
    DC.findAll({
      include: [{
          model: Investidor,
        }],
    }).then((dcs) => {
    Investidor.findAll().then(async(investidores) => {

          //////////////////////Capital Investidor
          var amountT = await DC.findOne({
            attributes: [sequelize.fn("sum", sequelize.col("valor"))],
           
            raw: true
          });
          var Total = (Number(amountT['sum(`valor`)'])).toLocaleFixed(2);
      
          
      res.render('admin/dc/index', {
        dcs: dcs,
        investidores: investidores,
        Total,
      });
    })
  })
  })

router.get('/admin/dc/new', (req, res) => {
  Investidor.findAll().then((investidores) => {
    res.render('admin/dc/new', {
      investidores: investidores,
    });
  });
});

router.post('/dc/save',  (req, res) => {
  var data = req.body.data;
  var valor = req.body.valor;
  var investidor = req.body.investidor;

   DC.create(
   {
    data: data,
    valor: valor,
    investidoreId: investidor
  })
  .then(() => {
    res.redirect("/admin/dc");
  });
});

router.get("/admin/dc/edit/:id", (req, res) => {
  var id = req.params.id;

DC.findByPk(id)
.then((dc) => {
  if (dc != undefined) {

    Investidor.findAll().then((investidores) => {
    res.render('admin/dc/edit', {
      dc: dc,
      investidores: investidores,
    })
  })
  } else{
    res.redirect('/admin/dc');
  }
})
.catch((err) => {
  res.redirect('/admin/dc');
})
})

router.post('/dc/update', (req, res) => {
  var id = req.body.id;
  var data = req.body.data;
  var valor = req.body.valor;
  var investidor = req.body.investidor;

  DC.update({
    data: data,
    valor: valor,
    investidoreId: investidor
  }, {
    where: {
      id: id,
    }
  })
  .then(() => {
    res.redirect("/admin/dc");
  })
  .catch((err) => {
    res.send("erro:" + err);
  });
})

router.post('/dc/delete', (req, res) => {
  var id = req.body.id;
  if (id != undefined) {
    if (!isNaN(id)) {
      DC.destroy({
        where: {
          id: id,
        },
      }).then(() => {
        res.redirect("/admin/dc");
      });
    } else {
      // NÃO FOR UM NÚMERO
      res.redirect("/admin/dc");
    }
  } else {
    // NULL
    res.redirect("/admin/dc");
  }
});

  module.exports = router;
 