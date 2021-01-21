const fs = require('fs')
const device = require('../../api/device')
const db = require('../../db')
const {database} = require('../../server')

module.exports = {
    format: function(content, req, res, ressources, callback){
        var cols = ['Date', 'Source', 'Destination', 'Texte']
        var colsString = ""
        for(col of cols){
            colsString += '<th>'+col+'</th>'
        }
        content = content.replace('{{ translations_columns }}', colsString)
        
        var rows = []
        db.select(database, 'SELECT * FROM translations WHERE device_id = ' + req.params.device_id + " ORDER BY translation_id DESC", function(translations){
            if(translations){
                var nowDate = new Date()
                for(translation of translations){
                    var date = new Date(Date.parse(translation.translated_at))
                    rows.push([
                        date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear(),
                        translation.from_lang,
                        translation.to_lang,
                        translation.text
                    ])
                }
            }
            
            var rowsString = ""
            for(row of rows){
                rowsString += "<tr>"
                for(i of row){
                    rowsString += "<td>"+i+"</td>"
                }
                rowsString += "</tr>"
            }

            content = content.replace('{{ translations_rows }}', rowsString)
            callback(content)
        })
    }
}