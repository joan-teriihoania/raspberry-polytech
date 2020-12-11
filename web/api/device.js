var translate = require('node-google-translate-skidz');
var {database} = require('../server');
var db = require('../db');

module.exports = {
    exec: function(req, res, next){
        if(!req.query.auth_key || req.query.auth_key != process.env.SECRET_KEY){
            res.status(401)
            res.send({error: "Unrecognized authentification key"})
            return
        }

        if(req.params.device_id){
            db.select(database, "SELECT * FROM devices WHERE device_id = " + req.params.device_id, function(rows){
                if(rows && rows.length > 0){
                    next()
                } else {
                    res.status(400)
                    res.send({error: "Unrecognized device ID"})
                }
            })
        } else {
            res.status(400)
            res.send({error: "Unspecified device ID"})
        }
    }
}