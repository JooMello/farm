const express = require("express");
const router = express.Router();
const Investidor = require("../../investidor/Investidor");
const adminAuth = require("../../../middlewares/adminAuth");

const Entrada = require("../entrada/Entrada");
const Saida = require("../saida/Saida");
const DebitoCredito = require("../debitoCredito/DebitoCredito");

//filtragem de dados, por peridodo que eles foram adicionados no BD
//formatar numeros em valores decimais (.toLocaleFixed(2))
Number.prototype.toLocaleFixed = function (n) {
  return this.toLocaleString(undefined, {
    minimumFractionDigits: n,
    maximumFractionDigits: n,
  });
};

router.get("/admin/contaCorrente", adminAuth, async (req, res, next) => {
  Investidor.findAll({
    include: [
      {
        model: Entrada,
      },
      {
        model: Saida,
      },
      {
        model: DebitoCredito,
      },
    ],
    raw: true,
    nest: true,
  }).then((investidores) => {
      //////////////////////Capital Investidor
      res.render("admin/financeiro/contaCorrente/index", {
        investidores: investidores,
      });
    });
  });

module.exports = router;
