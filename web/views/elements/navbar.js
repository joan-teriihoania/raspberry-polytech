const fs = require('fs')

module.exports = {
    format: function(content, req, res, callback){
        if(res.user.is_auth){
            fs.readFile('./views/elements/navbar/user_auth.html', function(err, user_auth_html){
                fs.readFile('./views/elements/navbar/notifications_messages.html', function(err, notifications_messages_html){
                    content = content.replace('{{ notifications_messages }}', notifications_messages_html)
                    content = content.replace('{{ user }}', user_auth_html)
                    callback(content)
                })
            })
        } else {
            fs.readFile('./views/elements/navbar/user_not_auth.html', function(err, user_not_auth_html){
                content = content.replace('{{ notifications_messages }}', "")
                content = content.replace('{{ user }}', user_not_auth_html)
                callback(content)
            })
        }
    }
}