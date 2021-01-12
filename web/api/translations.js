var {database} = require('../server');
var db = require('../db');

module.exports = {
    exec: function(req, res){
        db.select(database, "SELECT * FROM devices WHERE user_id = " + res.user.user_id, function(devices){
            if(devices && devices.length > 0){
                var promises = []
                var allRows = []
                for(device of devices){
                    var request = "SELECT translation_id, from_lang, to_lang, text, translated_at FROM translations WHERE device_id = " + device.device_id
                    if(req.query.month_ago){
                        request += " AND translated_at BETWEEN datetime('now', '-"+req.query.month_ago+" months') AND datetime('now', 'localtime')"
                    } else if(req.query.day_ago){
                        request += " AND translated_at BETWEEN datetime('now', '-"+req.query.day_ago+" days') AND datetime('now', 'localtime')"
                    } else if(req.query.hours){
                        request += " AND translated_at BETWEEN datetime('now', '-"+req.query.month_ago+" hours') AND datetime('now', 'localtime')"
                    }

                    if(req.query.limit){request += " LIMIT " + req.query.limit}
                    promises.push(new Promise(function(resolve, reject){
                        db.select(database, request, function(rows){
                            if(rows && rows.length > 0){
                                for(row of rows){
                                    allRows.push(row)
                                }
                            }
                            resolve()
                        })
                    }))
                }

                Promise.all(promises).then(() => {
                    res.status(200)
                    res.send(allRows)
                })
            } else {
                res.status(200)
                res.send([])
            }
        })
    }
}