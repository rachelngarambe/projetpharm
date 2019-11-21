var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressHbs = require('express-handlebars');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var passport = require('passport');
var flash = require('connect-flash');
const session = require('express-session');
const { ensureAuthenticated } = require('./config/auth');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

require('./config/passport')(passport);

require('./config/database');


// view engine setup
//app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', expressHbs({defaultLayout: 'layout', extname: '.hbs'}));
//app.set('view engine', '.hbs');
app.set('view engine', 'ejs');

app.use(express.static('public'));

//Express Session
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

//Passport middfleware
app.use(passport.initialize());
app.use(passport.session());

//Connect flash
app.use(flash());

//Global Vars
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
/*
app.use((req, res, next) =>
{
  res.locals.login = req.ensureAuthenticated();
  next();
});
*/
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use('/users', usersRouter);
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//Starting server
const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on ${server.address().port}`);
});

module.exports = app;
