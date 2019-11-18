var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt-nodejs');
const passport = require('passport');
const { ensureAuthenticated } = require('../config/auth');
const { ensureNotAuthenticated } = require('../config/unauth');


var mysql = require('../config/connect');

const initializePassport = require('../config/passport');
initializePassport(passport,
  email => "SELECT email, password FROM client WHERE email = '" + req.boby.email + "'");

/* GET users listing. */


/* GET Profile page. */
router.get('/profile', ensureAuthenticated, function(req, res, next) {
  res.render('user/profile', { title: 'Profile' });
});

/* GET / page */
router.get('/', ensureNotAuthenticated, (req, res, next) =>
{
  next(); 
});

/* GET Login page. */
router.get('/signin', function(req, res, next) {
  res.render('user/signin', { title: 'Signin' });
});

/* GET Register page. */
router.get('/signup', function(req, res, next) {
  res.render('user/signup', { title: 'Signup' });
});

/* GET Register page. */
router.get('/logout', function(req, res, next) {
  req.logout();
  res.redirect('/');
});

//post


router.post('/register', (req, res, err) =>
{
  var hashedPassword = bcrypt.hashSync(req.body.password, null, null);
  var sql = "INSERT INTO client (firstname, lastname, gender, phone, email, password, addre) VALUES (?,?,?,?,?,?,?)";
  var parms = [req.body.first, req.body.last, req.body.gender,req.body.phone, req.body.email, hashedPassword, req.body.address];
  mysql.query(sql, parms);
  
  res.redirect('/users/signin');
});

router.post('/signin', (req, res, next) => {
  passport.authenticate('local', {
      successRedirect: '/users/profile',
      failureRedirect: '/signin',
      failureFlash: true
  })(req, res, next);
});

module.exports = router;
