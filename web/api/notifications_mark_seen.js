const { encrypt } = require('../crypto');
const db = require('../db');
const { database } = require('../server');

module.exports = {
    exec: function(req, res){
        if(!req.params.notif_id){
            res.status(400)
            res.send("Identification de notification vide")
            return
        }

        db.select(database, "SELECT * FROM notifications WHERE user_id = " + res.user.user_id + " AND notif_id = " + req.params.notif_id, function(rows){
            if(rows && rows.length > 0){
                db.run(database, "UPDATE notifications SET seen = 1 WHERE notif_id = " + req.params.notif_id)
            }
            res.status(200)
            res.send('OK')
        })
    }
}