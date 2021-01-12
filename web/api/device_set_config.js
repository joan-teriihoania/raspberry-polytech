var {database} = require('../server');
var db = require('../db');
var {database} = require('../server');

module.exports = {
    exec: function(req, res){
        if(req.body.from_lang && req.body.to_lang){
            db.select(database, 'SELECT * FROM devices WHERE user_id = '+res.user.user_id+' AND device_id = '+req.params.device_id, function(devices){
                if(devices && devices.length > 0){
                    console.log('UPDATE devices SET from_lang = "'+req.body.from_lang+'", to_lang = "'+req.body.to_lang+'" WHERE device_id = ' + devices[0].device_id)
                    db.run(database, 'UPDATE devices SET from_lang = "'+req.body.from_lang+'", to_lang = "'+req.body.to_lang+'" WHERE device_id = ' + devices[0].device_id).then(() => {
                        res.status(200)
                        res.send("OK")
                    })
                } else {
                    res.status(400)
                    res.send("Appareil inconnu")
                }
            })
        } else {
            res.status(400)
            res.send("Arguments manquants")
        }
    }
}