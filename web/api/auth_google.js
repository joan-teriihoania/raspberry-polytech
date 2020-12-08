const db = require('../db');
const { authentificate } = require('../googleutils');
const { database } = require('../server');

module.exports = {
    exec: function(req, res){
      authentificate(req.query.code, function(info){
        if(info){
          db.select(database, 'SELECT * FROM users WHERE email = "'+info.email+'" AND auth_google = 1', function(rows){
              if(rows && rows.length > 0){
                  db.run(database, "UPDATE users SET access_token = '"+info.id_token+"' WHERE user_id = " + rows[0]['user_id'])
                  res.status(200)
                  res.send(rows[0])
              } else {
                  res.status(401)
                  res.send("Identifiants inconnus")
              }
          })
        } else {
          console.log(err)
          res.status(401)
          res.send("Identifiants incorrectes")
        }
      })
      return
    }
}