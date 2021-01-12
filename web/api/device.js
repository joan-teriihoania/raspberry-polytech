var {database} = require('../server');
var db = require('../db');

module.exports = {
    exec: function(req, res, next){
        if(req.params.device_id){
            db.select(database, "SELECT * FROM devices WHERE device_id = " + req.params.device_id, function(devices){
                if(devices && devices.length > 0){
                    db.select(database, "SELECT * FROM users WHERE user_id = " + devices[0].user_id + " AND auth_key = '"+res.user.auth_key+"'", function(users){
                        if(users && users.length > 0 || req.query.auth_key == process.env.SECRET_KEY || req.body.auth_key == process.env.SECRET_KEY){
                            next()
                        } else {
                            res.status(400)
                            res.send("Clé d'authentification refusée")
                        }
                    })
                } else {
                    res.status(400)
                    res.send("ID d'appareil inconnu")
                }
            })
        } else {
            res.status(400)
            res.send("ID d'appareil vide")
        }
    }
}