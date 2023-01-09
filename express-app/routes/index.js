var express = require('express');
var router = express.Router();
const adminAuth = require("../middlewares/adminAuth")

/* GET home page. */
router.post('/', adminAuth, (req, res, next) => {
  res.render('index', );
});



module.exports = router;
