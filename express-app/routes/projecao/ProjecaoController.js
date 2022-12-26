const express = require('express');
const router = express.Router();
const Compra = require("../compra/Compra");
const slugify = require("slugify");
const sequelize = require("sequelize");
const { Op } = require("sequelize");


var app = express();

const Investidor = require("../investidor/Investidor")

router.get('/admin/projecao', async (req, res, next) => {
    Compra.findAll({
      include: [{
        model: Investidor,
      }],
      order: [
        ["createdAt", "DESC"]
      ],
       raw: true,
      nest: true,
    }).then((compras) => {
        res.render('admin/projecao/index', {
          compras,
        });
    })
  });


module.exports = router;