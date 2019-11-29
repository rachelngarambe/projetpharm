var createError = require('http-errors');
var http = require('http')
var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var dotenv = require('dotenv');
var expressHbs = require('express-handlebars');
var path = require('path');
var logger = require('morgan');
var passport = require('passport');
var flash = require('connect-flash');
var fileUpload = require('express-fileupload');

dotenv.config();
const stripe = require('stripe')(process.env.SECRET_KEY); // Add your Secret Key Here

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');


const app = express();

// This will make our form data much more useful
app.use(bodyParser.urlencoded({ extended: true }));

// This will set express to render our views folder, then to render the files as normal html
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.engine('.hbs', expressHbs({ defaultLayout: 'layout', extname: '.hbs' }));
// app.use(express.static(path.join(__dirname, './views')));
app.use(express.static('public'));
app.use(fileUpload());

//Express Session
app.use(session({
  secret: 'this is secret',
  resave: true,
  saveUninitialized: true
}));

//Connect flash
app.use(flash());

//Global Vars
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.loginMessage = req.flash('loginMessage');
  res.locals.error = req.flash('error');
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, './views')));

// Future Code Goes Here
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

app.use('/users', usersRouter);
app.use('/', indexRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server is running...'));