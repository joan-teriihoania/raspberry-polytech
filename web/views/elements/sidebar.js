const fs = require('fs')

module.exports = {
    format: function(content, req, res){
        if(res.user.is_auth){
            return content
        } else {
            return ""
        }
    }
}