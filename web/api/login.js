const { encrypt, decrypt} = require('../crypto');

module.exports = {
    exec: function(req, res){
        if(req.body.email && req.body.password){
            res.cookie("JZ-Translation-auth0", encrypt(req.body.email))
            res.cookie("JZ-Translation-auth1", encrypt(req.body.password))
        }

        res.redirect('/')
    }
}