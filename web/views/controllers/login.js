const auth = require('../../auth');
const googleutils = require('../../googleutils');

module.exports = {
    format: function(content, req, res, ressources, callback){
        if(res.user.is_auth){
            res.redirect('/')
            callback(false)
        } else {
            content = content.replace(/{{ google_auth_url }}/gi, googleutils.getAuthURL())
            callback(content)
        }
    }
}