const fs = require('fs')

module.exports = {
    format: function(content, req, res, callback){
        if(res.user.is_auth){
            callback(content)
        } else {
            callback("")
        }
    }
}