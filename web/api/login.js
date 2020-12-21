const { encrypt } = require('../crypto');
const db = require('../db');
const googleutils = require('../googleutils');
const { database, generateAuthKey } = require('../server');

module.exports = {
    exec: function(req, res){
        var email = req.query.email
        var password = req.query.password
        var code = req.query.code
        if(email != undefined && password != undefined){
            db.select(database, 'SELECT * FROM users WHERE auth_google = "false" AND email = "'+email+'" AND password = "'+password+'"', function(rows){
                if(rows && rows.length > 0){
                    res.cookie("JZ-Translation-auth", encrypt(JSON.stringify({
                        "auth_key": rows[0].auth_key
                    })))

                    res.status(200)
                    res.send(rows[0])
                    return
                } else {
                    db.select(database, 'SELECT * FROM users WHERE auth_google = "true" AND email = "'+email+'"', function(rows){
                        if(rows && rows.length > 0){
                            res.status(401)
                            res.send("Cette adresse mail utilise un compte Google.")
                        } else {
                            res.status(401)
                            res.send("Identifiants incorrectes")
                        }
                        return
                    })
                }
            })
        } else {
            if(code != undefined){
                googleutils.authentificate(code, function(userinfo){
                    if(userinfo){
                        db.select(database, 'SELECT * FROM users WHERE auth_google = "true" AND email = "'+userinfo.data.email+'"', function(rows){
                            if(rows && rows.length > 0){
                                if(rows[0].img_profile == ""){
                                    db.run(database, 'UPDATE users SET img_profile = "'+userinfo.data.picture+'" WHERE user_id = ' + rows[0].user_id)
                                }

                                db.select(database, 'SELECT * FROM users WHERE auth_google = "true" AND email = "'+userinfo.data.email+'"', function(rows){
                                    res.cookie("JZ-Translation-auth", encrypt(JSON.stringify({
                                        "access_token": userinfo.access_token
                                    })))

                                    res.status(200)
                                    res.send(rows[0])
                                    return
                                })
                            } else {
                                db.select(database, 'SELECT * FROM users WHERE auth_google = "false" AND email = "'+userinfo.data.email+'"', function(rows){
                                    if(rows && rows.length > 0){
                                        res.status(401)
                                        res.send("Cette adresse mail n'utilise pas de compte Google.")
                                        return
                                    } else {
                                        var user_auth_key = generateAuthKey(32)
                                        db.insert(database, "users", [
                                            {
                                                "username": userinfo.data.name,
                                                "auth_google": "true",
                                                "img_profile": userinfo.data.picture,
                                                "email": userinfo.data.email,
                                                "password": "",
                                                "auth_key": user_auth_key,
                                                "level": 0
                                            }
                                        ]).then(() => {
                                            db.select(database, 'SELECT * FROM users WHERE auth_google = "true" AND email = "'+userinfo.data.email+'"', function(rows){
                                                res.cookie("JZ-Translation-auth", encrypt(JSON.stringify({
                                                    "access_token": userinfo.access_token
                                                })))
                                                db.run(database, 'UPDATE users SET auth_key = "' + rows[0].user_id + rows[0].auth_key + '" WHERE user_id = ' + rows[0].user_id)
                                                res.status(200)
                                                res.send(rows[0])
                                                return
                                            })
                                        }).catch(() => {
                                            res.status(401)
                                            res.send("Nous n'avons pas pu créer votre compte.")
                                            return
                                        })
                                    }
                                })
                            }
                        })
                    } else {
                        res.status(401)
                        res.send("Nous n'avons pas pu nous connecter à votre compte Google")
                        return
                    }
                })
            } else {
                res.status(401)
                res.send("Vous n'avez pas renseigné d'identifiants")
                return
            }
        }
    }
}