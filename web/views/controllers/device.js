var {database} = require('../../server');
var db = require('../../db');
var fs = require('fs')

module.exports = {
    format: function(content, req, res, ressources, callback){
        if(req.params.device_id){
            db.select(database, "SELECT * FROM devices WHERE device_id = " + req.params.device_id, function(devices){
                if(devices && devices.length > 0){
                    db.select(database, "SELECT * FROM users WHERE user_id = " + devices[0].user_id + " AND auth_key = '"+res.user.auth_key+"'", function(users){
                        if(users && users.length > 0){
                            callback(content)
                        } else {
                            res.status(403)
                            error_page("Accès refusé", 403, "Vous n'avez pas accès à cet appareil.", function(page){
                                callback(page)
                            })
                        }
                    })
                } else {
                    res.status(400)
                    error_page("Appareil introuvable", 400, "L'appareil demandé est introuvable.", function(page){
                        callback(page)
                    })
                }
            })
        } else {
            res.status(400)
            error_page("Appareil introuvable", 400, "L'appareil demandé est introuvable.", function(page){
                callback(page)
            })
        }
    }
}

function error_page(title, status, message, callback){
    fs.readFile("./views/pages/error.html", function(err, page){
        page = page.toString()
        page = page.replace(/{{ title }}/gi, title)
        page = page.replace(/{{ status }}/gi, status)
        page = page.replace(/{{ message }}/gi, message)
        callback(page)
    })
}