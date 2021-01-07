var {database} = require('../server');
var db = require('../db');
var {database} = require('../server');

module.exports = {
    exec: function(req, res){
        if(req.body.pin_code){
            db.select(database, 'SELECT * FROM devices WHERE linked = "false" AND pin_code = "'+req.body.pin_code+'"', function(links){
                if(links && links.length > 0){
                    db.run(database, 'UPDATE devices SET user_id = '+res.user.user_id+', linked = "true" WHERE device_id = ' + links[0].device_id).then(() => {
                        res.status(200)
                        res.send({device_id: links[0].device_id})
                    }).catch((reason) => {
                        res.status(400)
                        res.send({error: reason})
                    })
                } else {
                    res.status(400)
                    res.send("Aucun appareil ne correspond à ce code PIN")
                }
            })
        } else {
            res.status(400)
            res.send("Code PIN vide")
        }
    }
}