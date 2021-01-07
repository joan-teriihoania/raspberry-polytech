var {database} = require('../server');
var db = require('../db');
var {database} = require('../server');

module.exports = {
    exec: function(req, res){
        if(req.params.device_id){
            db.select(database, 'SELECT * FROM devices WHERE linked = "true" AND user_id = ' + res.user.user_id + " AND device_id = " + req.params.device_id, function(links){
                if(links && links.length > 0){
                    db.run(database, 'UPDATE devices SET user_id = -1, linked = "false" WHERE device_id = ' + links[0].device_id).then(() => {
                        res.status(200)
                        res.send({device_id: links[0].device_id})
                    }).catch((reason) => {
                        res.status(400)
                        res.send({error: reason})
                    })
                } else {
                    res.status(400)
                    res.send("Cet appareil n'existe pas ou ne vous appartient pas")
                }
            })
        } else {
            res.status(400)
            res.send("Code PIN vide")
        }
    }
}