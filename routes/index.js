var express = require('express');
var router = express.Router();
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

  mysql.query('SELECT m.id_item, m.title, m.pharmacy, p.name as pharmacyname, m.description, m.image, c.price as price FROM medicament m INNER JOIN category c ON m.category = c.id INNER JOIN pharmacy p ON m.pharmacy = p.id', (err, rows, fields) => {
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
  mysql.query('SELECT m.title, m.description, m.image, c.type, c.price as price FROM medicament m INNER JOIN category c ON m.category = c.id_item', (err, rows, fields) =>
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

router.get('/pharmacy', ensureAuthenticated, (req, res, next) => {
  mysql.query("SELECT * From pharmacy", (err, rows, field) => {
    if (!err) {
      res.render('admin/pharmacy', { title: 'Admin', result: rows })
    }
    else {
      res.send(err);
    }
  });
});

router.get('/medecines', ensureAuthenticated, (req, res, next) => {
  mysql.query("SELECT c.type, c.price, m.title, m.image, m.quantity, m.id_item, p.id, p.name, a.location, a.num "
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

router.get('/user', ensureAuthenticated, (req, res, next) => {
  mysql.query("SELECT * from client", (err, rows, field) => {
    if (!err) {
      res.render('admin/users', { title: 'Admin', result: rows })
    }
    else {
      res.send(err);
    }
  });
});

// contacted list
router.get('/contacts', ensureAuthenticated, (req, res, next) => {
  mysql.query("SELECT * from contact", (err, rows, field) => {
    if (!err) {
      res.render('admin/contact', { title: 'Admin', result: rows })
    }
    else {
      res.send(err);
    }
  });
});

router.get('/buyers', ensureAuthenticated, (req, res, next) => {
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
      .then(() => {
        // get email into local storage in node
        if (typeof localStorage === "undefined" || localStorage === null) {
          var LocalStorage = require('node-localstorage').LocalStorage;
          localStorage = new LocalStorage('./scratch');
        }
        var email = localStorage.getItem('medicalmanagementEmail');

        mysql.query("DELETE FROM facture WHERE personemail = '" + email + "'", (err) => {
          if (!err) {
            res.render("completed.html")
          }
          else {
            res.send(err);
          }
        });
      })
      .catch(err => console.log(err));
  } catch (err) {
    res.send(err);
  }
});


router.post('/pharma', ensureAuthenticated, (req, res, next) => {
  var sql1 = "INSERT INTO `pharmacy`(`name`, `address`) VALUES (?,?)";
  var parms1 = [req.body.p_name, req.body.p_address];

  mysql.query(sql1, parms1);

  res.redirect('/pharmacy');
});


// add medecine
router.post('/medecine', ensureAuthenticated, (req, res, next) => {
  if (req.method == "POST") {
    if (!req.files)
      return res.status(400).send('No files were uploaded.');

    var file = req.files.m_image;
    var img_name = file.name;

    if (file.mimetype == "image/jpeg" || file.mimetype == "image/png" || file.mimetype == "image/gif") {

      file.mv('public/images/' + file.name, function (err) {
        if (err)
          return res.status(500).send(err);
        //     // succesfful uploaded
        var sql1 = "INSERT INTO `medicament`(`title`, `description`,`category`,`pharmacy`, `image`,`quantity` ) VALUES (?,?,?,?,?,?)";
        var sql2 = "INSERT INTO `category`(`type`, `price` ) VALUES (?,?)";
        var parms1 = [req.body.m_name, req.body.m_description, req.body.m_category, req.body.m_pharmacy, img_name, req.body.m_quantity];
        var parms2 = [req.body.m_name, req.body.m_price];

        mysql.query(sql1, parms1);
        mysql.query(sql2, parms2);

        res.redirect('/medecines');
      });
    } else {
      message = "This format is not allowed , please upload file with '.png','.gif','.jpg'";
      res.render('index.ejs', { message: message });
    }
  } else {
    res.render('index');
  }
});

/*******************************
 * **********
 * Admin
 * *****************
 * *************************************************************************** */

/* GET home page One Item in modal. */
router.post('/add-to-cart/:title', function (req, res, next) {
  mysql.query("SELECT m.id_item, m.title, m.description, m.image, c.price as price FROM medicament m INNER JOIN category c ON m.category = c.id WHERE title = '" + req.params.title + "'", (err, rows, fields) => {
    if (!err) {
      res.render('shop/add-to-cart', { title: 'my_pharmacy|home', result: rows });
      //res.send(rows);
    }
    else {
      res.render('error', { title: 'Error on your query' });
    }
  });
});

/* GET home page One Item in modal. */
router.get('/add-to-cart/', function (req, res, next) {
  mysql.query("SELECT m.id_item, m.title, m.pharmacy, p.name as pharmacyname, m.description, m.image, c.price as price FROM medicament m INNER JOIN category c ON m.category = c.id INNER JOIN pharmacy p ON m.pharmacy = p.id WHERE title = '" + req.params.title + "'", (err, rows, fields) => {
    if (!err) {
      res.render('shop/add-to-cart', { title: 'my_pharmacy|home', result: rows });
      //res.send(rows);
    }
    else {
      res.render('error', { title: 'Error on your query' });
    }
  });
});

router.post('/contact', (req, res, err) => {

  var sql = "INSERT INTO contact (name, email, content) VALUES (?,?,?)";
  var parms = [req.body.name, req.body.email, req.body.content];
  mysql.query(sql, parms);

  res.redirect('/');
});

router.post('/savemail', (req, res, err) => {
  // setting email into local storage in node
  if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
  }
  localStorage.setItem('medicalmanagementEmail', req.body.email);
  console.log(localStorage.getItem('medicalmanagementEmail'));

  res.redirect('/');
});

router.post('/checkout', (req, res, err) => {
  var sql = "INSERT INTO facture (items, price, quantity, personemail) VALUES (?,?,?,?)";
  var sql2 = "INSERT INTO alltransaction (items, price, quantity, personemail) VALUES (?,?,?,?)";
  var parms = [req.body.cart_title, req.body.cart_price, req.body.cart_quantity, req.body.cart_email];
  mysql.query(sql, parms);
  mysql.query(sql2, parms);

  res.redirect('/checkout');
});

router.post('/checking', (req, res, err) => {
  res.redirect('/pa');
});


router.get('/checkout', (req, res, next) => {
  // get email into local storage in node
  if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
  }
  var email = localStorage.getItem('medicalmanagementEmail');

  mysql.query("SELECT * FROM facture WHERE personemail = '" + email + "'", (err, rows, fields) => {
    if (!err) {
      res.render('shop/checkout', { title: 'Admin', result: rows })
    }
    else {
      res.send(err);
    }
  });
});

// Removing product to checkout list
router.post('/removing', (req, res, next) => {
  // get email into local storage in node
  if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
  }
  var email = localStorage.getItem('medicalmanagementEmail');

  mysql.query("DELETE FROM facture WHERE id = '" + req.body.itemId + "' AND personemail = '" + email + "'");
  mysql.query("DELETE FROM alltransaction WHERE id = '" + req.body.itemId + "' AND personemail = '" + email + "'", (err) => {
    if (!err) {
      console.log('Successful deleted')
      res.redirect('/checkout');
    }
    else {
      res.send(err);
    }
  });
});

// Deleting medecine 
router.post('/deletemedecine', (req, res, next) => {
  mysql.query("DELETE FROM medicament WHERE id_item = '" + req.body.itemId + "'", (err) => {
    if (!err) {
      res.redirect('/medecines');
    }
    else {
      res.send(err);
    }
  });
});

//Deleting pharmacy
router.post('/deletepharma', (req, res, next) => {
  mysql.query("DELETE FROM pharmacy WHERE id = '" + req.body.pharmaId + "'", (err) => {
    if (!err) {
      res.redirect('/pharmacy');
    }
    else {
      res.send(err);
    }
  });
});

//Deleting user
router.post('/deleteuser', (req, res, next) => {
  mysql.query("DELETE FROM client WHERE id = '" + req.body.userId + "'", (err) => {
    if (!err) {
      res.redirect('/user');
    }
    else {
      res.send(err);
    }
  });
});

/* GET all Details. */
router.get('/operations', function (req, res, next) {
  mysql.query('SELECT * FROM alltransaction', (err, rows, fields) => {
    if (!err) {
      res.render('admin/operation', { title: 'pharmacy| operations', result: rows });
    }
  })
});

module.exports = router;