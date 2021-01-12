var {database} = require('../server');
var db = require('../db');
var {database} = require('../server');

module.exports = {
    exec: function(req, res){
        db.select(database, 'SELECT * FROM devices WHERE device_id = '+req.params.device_id, function(devices){
            if(devices && devices.length > 0){
                if(devices[0]['from_lang'] != "" && devices[0]['to_lang'] != ""){
                    if(req.query.mark_seen){
                        db.run(database, 'UPDATE devices SET from_lang = "", to_lang = "" WHERE device_id = ' + devices[0].device_id).then(() => {
                            res.status(200)
                            res.send({from_lang: devices[0]['from_lang'], to_lang: devices[0]['to_lang']})
                        })
                    } else {
                        res.status(200)
                        res.send({from_lang: devices[0]['from_lang'], to_lang: devices[0]['to_lang']})
                    }
                } else {
                    res.status(200)
                    res.send({})
                }
            } else {
                res.status(400)
                res.send("Appareil inconnu")
            }
        })
    }
}