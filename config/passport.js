const LocalStrategy = require('passport-local').Strategy;
const mysql = require('mysql');
const bcrypt = require('bcrypt-nodejs');

//Load User Model
//const User = require('./database');
var dbConfig = require('./database');
var connection = mysql.createConnection(dbConfig.connection);

connection.query('USE ' + dbConfig.database);

module.exports = function(passport) {
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
        /*new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
            User.findOne({ email: email })
            .then(user => {
                if(!user){
                    return done(null, false, { message: 'That email is not registered'});
                }

                // Match password
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if(err) throw err;

                    if(isMatch) {
                        return done(null, user);
                    }
                    else {
                        return done(null, false, { message: 'Password incorect' });
                    }
                });
            })
            .catch(err => console.log(err))
        })*/
        'local',
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
} 