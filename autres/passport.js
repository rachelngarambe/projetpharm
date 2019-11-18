var LocalStrategy  = require('passport-local').Strategy;

var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var dbConfig = require('./database');
var connection = mysql.createConnection(dbConfig.connection);

connection.query('USE ' + dbConfig.database);

module.exports = function (passport)
{
    passport.serializeUser (function(user, done)
    {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done)
    {
        connection.query("SELECT * FROM client WHERE id = ? ", [id],
        function(err, rows)
        {
            done(err, rows[0]);
        });
    });
    
    passport.use(
        'local-signup',
        new LocalStrategy({
            emailField : 'email',
            passwordField : 'password',
            passReqToCallback : true
        },
        function (req, email, password, done)
        {
            connection.query("SELECT * FROM client WHERE email = ?",
            [email], function (err, rows) {
                if (err)
                    return done(err);
                if (rows.length)
                {
                    return done(null, false, req.flash('signupMessage', 'That is already taken'));
                }
                else
                {
                    var newUserMysql = {
                        firstname : firstname,
                        lastname : lastname,
                        gender : gender,
                        phone : phone,
                        email : email,
                        password : bcrypt.hashSync(password, null, null),
                        addre : addre
                    };

                    var insertQuery = "INSERT INTO client(firstname, lastname, gender, phone, email, password, addre) VALUES (?,?,?,?,?,?,?)";

                    connection.query(insertQuery, [
                        newUserMysql.first,
                        newUserMysql.last,
                        newUserMysql.gender,
                        newUserMysql.phone,
                        newUserMysql.email,
                        newUserMysql.password, 
                        newUserMysql.address
                    ], function (err, rows) 
                    {
                        newUserMysql.id = rows.insertId;

                        return done(null, newUserMysql);
                    });
                }
            });
        })
    );

    passport.use (
        'local-login',
        new LocalStrategy({
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true
        },
        function (req, email, password, done)
        {
            connection.query("SELECT * FROM client WHERE email = ? ", [email],
            function(err, rows)
            {
                if (err)
                    return done(err);
                if (!rows.length)
                {
                    return done(null, false, req.flash('loginMessage','No user found'));
                }
                if(!bcrypt.compareSync(password, rows[0].password))
                    return done(null, false, req.flash('loginMessage','Wrong password'));
                
                    return done(null, rows[0]);
            });
        })
    );
};