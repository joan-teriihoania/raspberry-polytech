const fs = require('fs')
const device = require('../../api/device')
const db = require('../../db')
const {database} = require('../../server')

module.exports = {
    format: function(content, req, res, ressources, callback){
        var cols = ['#', 'Traductions (mois)', 'Traductions (total)', 'Dernière activité', 'Actions']
        var colsString = ""
        for(col of cols){
            colsString += '<th>'+col+'</th>'
        }
        content = content.replace('{{ devices_columns }}', colsString)
        
        var rows = []
        db.select(database, 'SELECT * FROM devices WHERE user_id = ' + res.user.user_id, function(devices){
            if(devices){
                var promises = []
                for(var device of devices){
                    var getRow = (device) => {
                        return new Promise(function(resolve, reject){
                            db.select(database, 'SELECT * FROM translations WHERE device_id = ' + device.device_id + " ORDER BY translation_id DESC", function(translations){
                                if(translations){
                                    var translations_month = 0
                                    var nowDate = new Date()
                                    for(translation of translations){
                                        var date = new Date(Date.parse(translation.translated_at))
                                        if(nowDate.getMonth() == date.getMonth()){
                                            translations_month += 1
                                        }
                                    }
                                    
                                    rows.push([
                                        device.device_id,
                                        translations_month,
                                        translations.length,
                                        translations.length > 0 ? translations[0].translated_at : "Aucune activité",
                                        '<a onclick="configure_device('+device.device_id+')" class="btn btn-primary btn-sm">Configurer</a>' +
                                        '\n<a class="btn btn-danger btn-sm" onclick="unlink_device('+device.device_id+')">Supprimer</a>'
                                    ])
                                    resolve()
                                }
                            })
                        })
                    }

                    promises.push(getRow(device))
                }

                Promise.all(promises).then(() => {
                    var rowsString = ""
                    for(row of rows){
                        rowsString += "<tr>"
                        for(i of row){
                            rowsString += "<td>"+i+"</td>"
                        }
                        rowsString += "</tr>"
                    }

                    content = content.replace('{{ devices_rows }}', rowsString)
                    callback(content)
                })
            }
        })
    }
}