var {database} = require('../server');
var db = require('../db');
var {database, generateAuthKey} = require('../server');

module.exports = {
    exec: function(req, res){
        var device_id = req.body.device_id
        if(!device_id){            
            db.insert(database, 'devices', [
                {
                    "user_id": -1,
                    "pin_code": generateAuthKey(5),
                    "linked": "false"
                }
            ]).then((lastIDs) => {
                db.select(database, 'SELECT * FROM devices WHERE device_id = ' + lastIDs[0], function(devices){
                    if(devices && devices.length > 0){
                        db.run(database, 'UPDATE devices SET pin_code = "' + devices[0].device_id + devices[0].pin_code + '" WHERE device_id = ' + devices[0].device_id)
                        db.select(database, 'SELECT * FROM devices WHERE device_id = ' + lastIDs[0], function(devices){
                            res.status(200)
                            res.send(devices[0])
                        })
                    } else {
                        res.status(500)
                        res.send("Erreur 0x1 lors de la liaison")
                    }
                })
            })
        } else {
            db.select(database, 'SELECT * FROM devices WHERE device_id = ' + device_id, function(devices){
                if(devices && devices.length > 0){
                    db.run(database, 'UPDATE SET linked = "false" WHERE device_id = ' + device_id).then(() => {
                        res.status(200)
                        res.send(devices[0])
                    }).catch(() => {
                        res.status(500)
                        res.send("Erreur 0x2 lors de la liaison")
                    })
                } else {
                    res.status(500)
                    res.send("Identifiant d'appareil inconnu")
                }
            })
        }
    }
}