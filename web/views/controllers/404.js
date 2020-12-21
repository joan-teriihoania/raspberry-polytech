const fs = require('fs')

module.exports = {
    format: function(content, req, res, ressources, callback){
        fs.readdir('./public/assets/img/404', function(err, files){
            if(!err && files.length > 0){
                content = content.replace('{{ random_404_img }}', files[Math.floor(Math.random() * files.length)])
            } else {
                content = content.replace('{{ random_404_img }}', '')
            }
            callback(content)
        })
    }
}