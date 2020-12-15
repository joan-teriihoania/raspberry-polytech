const { encrypt } = require('../crypto');
const db = require('../db');
const { database } = require('../server');

module.exports = {
    exec: function(req, res){
        db.select(database, "SELECT * FROM notifications WHERE user_id = " + res.user.user_id, function(rows){
            res.status(200)
            if(rows && rows.length > 0){
                res.send(rows)
                res.end()
            } else {
                res.send([])
            }
        })
    }
}