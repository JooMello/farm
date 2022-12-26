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
    Investidor.findAll().then((investidores) => {
      res.render('admin/dc/index', {
        dcs: dcs,
        investidores: investidores,
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


  module.exports = router;
 