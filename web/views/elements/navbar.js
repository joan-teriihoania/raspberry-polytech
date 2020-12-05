const fs = require('fs')

module.exports = {
    format: function(content, req, res){
        if(res.user.is_auth){
            content = content.replace('{{ data:user_name }}', res.user.username)
            if(res.user.img_profile != ""){
                content = content.replace('{{ data:user_img_profile }}', res.user.img_profile)
            } else {
                content = content.replace('{{ data:user_img_profile }}', "none.png")
            }
            return content
        } else {
            return ""
        }
    }
}