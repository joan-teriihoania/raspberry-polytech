module.exports = {
    format: function(content, req, res, ressources, callback){
        content = content.replace(/{{ if_auth_google_disable }}/gi, res.user['auth_google'] == 'true' ? "disabled" : "")
        content = content.replace(/{{ email_field_warning }}/gi, res.user['auth_google'] == 'true' ? "Vous ne pouvez pas modifier votre mail avec un compte Google" : "")
        callback(content)
    }
}