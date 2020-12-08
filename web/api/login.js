const { encrypt } = require('../crypto');
const db = require('../db');
const googleutils = require('../googleutils');
const { database } = require('../server');

module.exports = {
    exec: function(req, res){
        var email = req.query.email
        var password = req.query.password
        var code = req.query.code
        if(email && password){
            db.select(database, 'SELECT * FROM users WHERE auth_google = "false" AND email = "'+email+'" AND password = "'+password+'"', function(rows){
                if(rows && rows.length > 0){
                    res.cookie("JZ-Translation-auth", encrypt(JSON.stringify({
                        "email": email,
                        "password": password,
                        "user_id": rows[0].user_id
                    })))

                    res.status(200)
                    res.send(rows[0])
                } else {
                    res.status(401)
                    res.send("Identifiants incorrectes")
                }
            })
        } else {
            if(code){
                googleutils.authentificate(code, function(userinfo){
                    if(userinfo){
                        db.select(database, 'SELECT * FROM users WHERE auth_google = "true" AND email = "'+userinfo.data.email+'"', function(rows){
                            if(rows && rows.length > 0){
                                res.cookie("JZ-Translation-auth", encrypt(JSON.stringify({
                                    "email": email,
                                    "password": password,
                                    "user_id": rows[0].user_id
                                })))

                                res.status(200)
                                res.send(rows[0])
                            } else {
                                res.status(401)
                                res.send("Identifiants incorrectes")
                            }
                        })
                    } else {
                        res.status(401)
                        res.send("Identifiants incorrectes")
                    }
                })
            } else {
                res.status(401)
                res.send("Identifiants incorrectes")
            }
        }
    }
}