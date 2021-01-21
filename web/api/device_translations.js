var {database} = require('../server');
var db = require('../db');
var {database, generateAuthKey} = require('../server');

module.exports = {
    exec: function(req, res){
        db.select(database, 'SELECT * FROM translations WHERE device_id = ' + req.params.device_id, function(translations){
            if(translations && translations.length > 0){
                res.status(200)
                res.send(translations)
            } else {
                res.status(500)
                res.send("Appareil inconnu")
            }
        })
    }
}