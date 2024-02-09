const express = require("express"),
    router = express.Router();
    const adminAuth = require("./middlewares/adminAuth")

//GET home page.
router.get("/", adminAuth, function(req, res) {
    res.render("index", { title: "Cattle Farm" });
});


module.exports = router;