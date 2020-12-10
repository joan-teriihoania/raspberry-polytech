var translate = require('node-google-translate-skidz');

module.exports = {
    exec: function(req, res, next){
        var params = req.params['0'] ? req.params['0'].split('/') : []
        if((req.params.device_id && req.params.device_id == "41") || (params.length > 0 && params[0] == "41")){
            next()
        } else {
            res.status(401)
            if(!req.params.device_id && params.length == 0){
                res.send({error: "No specified device ID"})
            } else {
                res.send({error: "Unrecognized device ID"})
            }
        }
    }
}