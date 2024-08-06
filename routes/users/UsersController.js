const express = require("express");
const router = express.Router();
const User = require("./User");
const bcrypt = require("bcryptjs");
var fs = require("fs");
const nodemailer = require('nodemailer');
const app = express();

router.get("/admin/users", (req, res) => {
  User.findAll().then((users) => {
    res.render("admin/users/index", { users: users });
  });
});

router.get("/admin/users/create", (req, res) => {
  res.render("admin/users/create");
});                                                                        
                                
router.post("/users/create", (req, res) => {
  var name = req.body.name
  var email = req.body.email;
  var phone = req.body.phone;
  var password = req.body.password;

  User.findOne({ where: { email: email} }).then((user) => {
    if (user == undefined) {
      var salt = bcrypt.genSaltSync(10);
      var hash = bcrypt.hashSync(password, salt);

      User.create({
        name: name,
        email: email,
        phone: phone,
        password: hash,
      })
        .then(() => {
          res.redirect("/");
        })
        .catch((err) => {
          res.redirect("/");
        });
    } else {
      res.redirect("/admin/users/create");
    }
  });
});

router.get("/login", (req, res) => {
  res.render("admin/users/login");
});

router.post("/authenticate", (req, res) => {
  var email = req.body.email;
  var password = req.body.password;


  User.findOne({ where: { email: email } }).then((user) => {
    if (user != undefined) {
      // Se existe um usuário com esse e-mail
      // Validar senha
      var correct = bcrypt.compareSync(password, user.password);

      if (correct) {
        req.session.user = {
          id: user.id,
          email: user.email,
        };
        res.redirect("/admin/relatorio");
      } else {
        res.redirect("/login");
      }
    } else {
      res.redirect("/login");
    }
  });
});

router.get("/password", (req, res) => {
  User.findAll().then((users) => {
    res.render("admin/users/password", { users: users });
  });
});

router.get("/logout", (req, res) => {
  req.session.user = undefined;
  res.redirect("/");
});

app.get("/epassword", async (req, res, next) => {

  var transport = nodemailer.createTransport({
      host: "smtp.mailtrap.io",
      port: 2525,
      auth: {
          user: "230c825f91b0cb",
          pass: "9ffd395cdd433d"
      }
  });

  var message = {
      from: "jvssmello@gmail.com",
      to: "joaovictorsouza0123@gmail.com",
      subject: "Instrução para recuperar a senha",
      text: "Prezado(a) Cesar. \n\nVocê solicitou alteração de senha.\n\n",
      html: "Prezado(a) Cesar. <br><br>Você solicitou alteração de senha.<br><br>"
  };

  transport.sendMail(message, function (err) {
      if (err) return res.status(400).json({
          erro: true,
          mensagem: "Erro: E-mail não enviado com sucesso!"
      });
  });

  return res.json({
      erro: false,
      mensagem: "E-mail enviado com sucesso!"
  });

});

router.post('/forgot_password', async (req, res, next) => {
  var email = req.body.email;

  try {
    const user = await User.findOne({  where: { email: email} });

    if(!user)
    return res.status(400).send({ error: 'User not found' });

    const token = crypto.randomBytes(20).toString('hex');

    const now = new Date();
    now.setHours(now.getHours() + 1);

    await User.findByIdUpdate(user.id, {
      '$set': {
        passwordResetToken: token,
        passwordResetExpires: now,
      }
    });

    console.log(token,now);

  } catch (err) {
    res.status(400).send({ error: 'Erro on forgot password, try again'});
  }
})

module.exports = router;