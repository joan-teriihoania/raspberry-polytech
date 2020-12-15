const db = require('./db')
const googleutils = require('./googleutils')

module.exports = {
    is_auth: function(database, user, req, callback){
        if(req.query.auth_key){
            db.select(database, 'SELECT * FROM users WHERE auth_key = "'+req.query.auth_key+'"', function(rows){
                if(rows && rows.length > 0){
                    callback("auth_key", rows[0])
                } else {
                    callback(false, undefined)
                }
            })
            return
        }

        if(req.body.auth_key){
            db.select(database, 'SELECT * FROM users WHERE auth_key = "'+req.body.auth_key+'"', function(rows){
                if(rows && rows.length > 0){
                    callback("auth_key", rows[0])
                } else {
                    callback(false, undefined)
                }
            })
            return
        }

        if(user.email && user.password && user.user_id){
            db.select(database, 'SELECT * FROM users WHERE auth_google = "false" AND email = "'+user.email+'" AND password = "'+user.password+'"', function(rows){
                if(rows && rows.length > 0 && user.user_id == rows[0].user_id){
                    callback("credentials", rows[0])
                } else {
                    callback(false, undefined)
                }
            })
            return
        }

        if(user.access_token){
            googleutils.getUserInfo(user.access_token, function(userinfo){
                if(userinfo){
                    db.select(database, 'SELECT * FROM users WHERE auth_google = "true" AND email = "'+userinfo.data.email+'"', function(rows){
                        if(rows && rows.length > 0){
                            callback("auth_google", rows[0])
                        } else {
                            callback(false, undefined)
                        }
                    })
                } else {
                    callback(false, undefined)
                }
            })
            return
        }

        callback(false, undefined)
    }
}