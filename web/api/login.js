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
                    return
                } else {
                    db.select(database, 'SELECT * FROM users WHERE auth_google = "true" AND email = "'+email+'"', function(rows){
                        if(rows && rows.length > 0){
                            res.status(401)
                            res.send("Le compte de cette adresse mail a été lié à un compte Google.")
                        } else {
                            res.status(401)
                            res.send("Identifiants incorrectes")
                        }
                        return
                    })
                }
            })
        } else {
            if(code){
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
                                        res.cookie("JZ-Translation-auth", encrypt(JSON.stringify({
                                            "email": rows[0].email,
                                            "password": rows[0].password,
                                            "user_id": rows[0].user_id
                                        })))

                                        res.status(200)
                                        res.send(rows[0])
                                        return
                                    } else {
                                        db.insert(database, "users", [
                                            {
                                                "username": userinfo.data.name,
                                                "auth_google": "true",
                                                "img_profile": userinfo.data.picture,
                                                "email": userinfo.data.email,
                                                "password": "",
                                                "level": 0
                                            }
                                        ]).then(() => {
                                            db.select(database, 'SELECT * FROM users WHERE auth_google = "true" AND email = "'+userinfo.data.email+'"', function(rows){
                                                res.cookie("JZ-Translation-auth", encrypt(JSON.stringify({
                                                    "access_token": userinfo.access_token
                                                })))
            
                                                res.status(200)
                                                res.send(rows[0])
                                                return
                                            })
                                        }).catch(() => {
                                            res.status(401)
                                            res.send("Un compte ayant la même adresse mail que votre compte Google existe mais n'y est pas lié.")
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

function generateAuthKey(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }