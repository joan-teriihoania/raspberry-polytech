var {database} = require('../server');
var db = require('../db');
var {database, generateAuthKey} = require('../server');

module.exports = {
    exec: function(req, res){
        db.select(database, 'SELECT * FROM devices WHERE device_id = ' + req.params.device_id, function(devices){
            if(devices && devices.length > 0){
                res.status(200)
                res.send({device_id: req.params.device_id, linked: devices[0].linked})
            } else {
                res.status(500)
                res.send("Identifiant d'appareil inconnu")
            }
        })
    }
}