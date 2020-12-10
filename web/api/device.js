var translate = require('node-google-translate-skidz');

module.exports = {
    exec: function(req, res, next){
        if(req.params.device_id){
            res.status(200)
            res.send("OK")
        } else {
            res.status(401)
            res.send("No device ID specified")
        }
    }
}