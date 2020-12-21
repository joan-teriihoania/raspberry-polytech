var translate = require('node-google-translate-skidz');
var {database} = require('../server');
var db = require('../db');

module.exports = {
    exec: function(req, res){
        if(req.query.from_lang && req.query.to_lang && req.query.text){
            db.select(database, 'SELECT * FROM users WHERE user_id IN (SELECT user_id FROM devices WHERE device_id = '+req.params.device_id+')', function(users){
                if(users && users.length > 0){
                    db.select(database, 'SELECT * FROM translations WHERE device_id = '+req.params.device_id, function(translations){
                        if(translations.length >= users[0].quota){
                            res.status(402)
                            res.send("Vous avez atteint votre quota de traduction")
                            res.end()
                            return
                        }
                        
                        translate({
                            text: req.query.text,
                            source: req.query.from_lang,
                            target: req.query.to_lang
                        }, function(result) {
                            if(result instanceof Error){
                                res.status(500)
                                res.send("Unable to translate")  
                                res.end()
                                return
                            }
                            
                            if(translations.length == users[0].quota-1){
                                db.insert(database, "notifications", [
                                    {
                                        "user_id": users[0].user_id,
                                        "type": "warning",
                                        "content": "Vous avez atteint votre quota de traduction mensuel",
                                        "link": "#",
                                        "icon": "chart-line"
                                    }
                                ])
                            }

                            if(req.query.text != "Translate"){
                                db.insert(database, "translations", [
                                    {
                                        "from_lang": req.query.from_lang,
                                        "to_lang": req.query.to_lang,
                                        "text": req.query.text,
                                        "device_id": req.params.device_id,
                                    }
                                ])
                            }

                            res.status(200)
                            res.send({translation: result.sentences[0].trans})
                            res.end()
                            return
                        });
                    })
                }else{
                    res.status(400)
                    res.end("Appareil inconnu")
                    return
                }
            })
        } else {
            res.status(400)
            res.end("Arguments manquants")
            return
        }
    }
}