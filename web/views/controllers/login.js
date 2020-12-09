const auth = require('../../auth');
const { authentificate } = require('../../googleutils');

module.exports = {
    format: function(content, req, res){
        if(res.user.is_auth){
            res.redirect('/')
            return false
        } else {
            return content
        }
    }
}