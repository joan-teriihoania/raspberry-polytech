const db = require('../db');
const { database } = require('../server');

module.exports = {
    exec: function(req, res){
        db.select(database, 'SELECT * FROM users WHERE user_id = ' + res.user.user_id, function(rows){
            if(rows && rows.length > 0){
                res.status(200)
                var profileData = rows[0]
                profileData['password'] = undefined
                res.send(rows[0])
            } else {
                res.status(500)
                res.send("Identifiants incorrectes")
            }
        })
    }
}