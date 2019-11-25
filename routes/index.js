var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt-nodejs');
const passport = require('passport');
const { ensureAuthenticated } = require('../config/auth');

const dotenv = require('dotenv');
dotenv.config();
const stripe = require('stripe')(process.env.SECRET_KEY); // Add your Secret Key Here



var mysql = require('../config/connect');

const initializePassport = require('../config/passport');
initializePassport(passport,
  email => "SELECT email, password FROM client WHERE email = '" + req.boby.email + "'");



/* GET home page. */
router.get('/', function (req, res, next) {

  var parm = req.body.search;
  mysql.query('SELECT m.id, m.title, m.description, m.image, c.price as price FROM medicament m INNER JOIN category c ON m.category = c.id', (err, rows, fields) =>
  //mysql.query('SELECT * FROM medecine', (err, rows,fields) =>
  {
    if (!err) {
      res.render('shop/index', { title: 'my_pharmacy|home', result: rows });
      //res.send(rows);
    }
    else {
      res.render('error', { title: 'Error on your query' });
    }
  });


});

/* GET home page. */
router.get('/search', function (req, res, next) {

  var parm = req.body.search;

  mysql.query("SELECT m.id, m.title, m.description, m.image, c.price as price FROM medicament m INNER JOIN category c ON m.category = c.id WHERE title LIKE '%" + req.body.search + "%'", (err, rows, fields) =>
  //mysql.query('SELECT * FROM medecine', (err, rows,fields) =>
  {
    if (!err) {
      res.render('shop/index', { title: 'my_pharmacy|home', result: rows });
      //res.send(rows);
    }
    else {
      res.render('error', { title: 'Error on your query' });
    }
  });

});

/* GET news page. */
router.get('/news', function (req, res, next) {
  mysql.query('SELECT * FROM news', (err, rows, fields) => {
    if (!err) {
      res.render('shop/news', { title: 'my_pharmacy|news', result: rows });
    }
  })
});

/*GET Product page.*/
router.get('/product', function (req, res, next) {
  mysql.query('SELECT m.title, m.description, m.image, c.type, c.price as price FROM medicament m INNER JOIN category c ON m.category = c.id', (err, rows, fields) =>
  //mysql.query('SELECT * FROM medecine', (err, rows,fields) =>
  {
    if (!err) {
      res.render('shop/product', { title: 'my_pharmacy|product', result: rows });
      //res.send(rows);
    }
    else {
      res.render('error', { title: 'Error on your query' });
    }
  });

});

/* GET About page. */
router.get('/about', function (req, res, next) {
  res.render('shop/about', { title: 'my_pharmacy|about us' });
});

/* GET Contact page. */
router.get('/contact', function (req, res, next) {
  res.render('shop/contact', { title: 'my_pharmacy|contact' });
});

router.get('/add-to-cart/:id', (req, res, next) => {
  var id = req.body.id;
  res.render('shop/add-to-cart', { id: id });
});


/*******************************
 * **********
 * Admin
 * *****************
 * *************************************************************************** */

router.get('/login', (req, res, next) => {
  res.render('admin/login', { title: 'Admin' })
});

router.get('/pharmacy', (req, res, next) => {
  mysql.query("SELECT * From pharmacy", (err, rows, field) => {
    if (!err) {
      res.render('admin/pharmacy', { title: 'Admin', result: rows })
    }
    else {
      res.send(err);
    }
  });
});

router.get('/medecines', (req, res, next) => {
  mysql.query("SELECT c.type, c.price, m.title, m.image, m.quantity, p.id, p.name, a.location, a.num "
    + "FROM category c INNER JOIN medicament m ON c.id = m.category INNER JOIN pharmacy p ON m.pharmacy = p.id "
    + "INNER JOIN addresses a ON p.address = a.id", (err, rows, field) => {
      if (!err) {
        res.render('admin/medecine', { title: 'Admin', result: rows })
      }
      else {
        res.send(err);
      }
    });
});

router.get('/customers', (req, res, next) => {
  mysql.query("SELECT * from client", (err, rows, field) => {
    if (!err) {
      res.render('admin/customer', { title: 'Admin', result: rows })
    }
    else {
      res.send(err);
    }
  });
});

// contacted list
router.get('/contacts', (req, res, next) => {
  mysql.query("SELECT * from contact", (err, rows, field) => {
    if (!err) {
      res.render('admin/contact', { title: 'Admin', result: rows })
    }
    else {
      res.send(err);
    }
  });
});

router.get('/buyers', (req, res, next) => {
  mysql.query("SELECT c.id, c.firstname, c.lastname, p.id, p.assurence, p.amounts, p.product, p.date "
    + "FROM client c JOIN paiement p ON c.id = p.assurence", (err, rows, field) => {
      if (!err) {
        res.render('admin/buyer', { title: 'Admin', result: rows })
      }
      else {
        res.send(err);
      }
    });
});

/* Paying page */
router.get('/pa', function (req, res, next) {
  res.render("index1.html", { title: 'my_pharmacy | payment' });
});

// Add payment
router.post("/charge", (req, res) => {
  try {
    stripe.customers
      .create({
        name: req.body.name,
        email: req.body.email,
        source: req.body.stripeToken
      })
      .then(customer =>
        stripe.charges.create({
          amount: req.body.amount * 100,
          currency: "rwf",
          customer: customer.id
        })
      )
      .then(() => res.render("completed.html"))
      .catch(err => console.log(err));
  } catch (err) {
    res.send(err);
  }
});


router.post('/pharma', (req, res, next) => {
  // var sql2 = "INSERT INTO `addresses`(`location`, `num`) VALUES (?,?)";
  var sql1 = "INSERT INTO `pharmacy`(`name`, `address`) VALUES (?,?)";
  var parms1 = [req.body.p_name, req.body.p_address];

  mysql.query(sql1, parms1);

  res.redirect('/pharmacy');
});

/*******************************
 * **********
 * Admin
 * *****************
 * *************************************************************************** */

/* GET home page. */
router.post('/add-to-cart/:id', function (req, res, next) {
  /*mysql.query("SELECT m.id, m.title, m.description, m.image, c.price as price FROM medicament m INNER JOIN category c ON m.category = c.id WHERE title = '"+req.body.title+"'", (err, rows,fields) =>
  //mysql.query('SELECT * FROM medecine', (err, rows,fields) =>
  {
    if (!err)
  {
    res.render('shop/index', { title: 'my_pharmacy|home', result: rows });
    //res.send(rows);
  }
  else
  {
    res.render('error', {title: 'Error on your query'});
  }
  });
  */
});

router.post('/contact', (req, res, err) => {

  var sql = "INSERT INTO contact (name, email, content) VALUES (?,?,?)";
  var parms = [req.body.name, req.body.email, req.body.content];
  mysql.query(sql, parms);

  res.redirect('/');
});

router.post('/add-to-cart', (req, res, next) => {
  var sql = "INSERT INTO facture (montant, category, quantity, payement_mode, person) VALUES (?,(SELECT id FROM category WHERE type = '" + req.body.title + "'),?,?,?";
});


module.exports = router;