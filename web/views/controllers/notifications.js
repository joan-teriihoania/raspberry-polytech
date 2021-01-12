const fs = require('fs')
const device = require('../../api/device')
const db = require('../../db')
const {database} = require('../../server')

module.exports = {
    format: function(content, req, res, ressources, callback){
        var cols = ['Type', 'Titre', 'Message', 'Lue', 'Date']
        var colsString = ""
        for(col of cols){
            colsString += '<th>'+col+'</th>'
        }
        content = content.replace('{{ notifications_columns }}', colsString)
        
        var rows = []
        db.select(database, 'SELECT * FROM notifications WHERE user_id = ' + res.user.user_id + " ORDER BY notif_id DESC", function(notifications){
            if(notifications){
                for(var notification of notifications){
                    rows.push({
                        "type": notification.type,
                        "seen": notification.seen,
                        "cols": [
                            "<span class='badge badge-"+notification.type+"'>"+notification.type.toUpperCase()+"</span>",
                            notification.title,
                            notification.content,
                            notification.seen ? '<i class="far fa-eye"></i>' : '<i class="far fa-eye-slash"></i>',
                            notification.created_at
                        ]
                    })
                }

                var rowsString = ""
                for(row of rows){
                    rowsString += "<tr class='table-"+row['type']+"'>"
                    for(col of row['cols']){
                        if(row['seen']){
                            rowsString += "<td>"+col+"</td>"
                        } else {
                            rowsString += "<td><b>"+col+"</b></td>"
                        }
                    }
                    rowsString += "</tr>"
                }
                content = content.replace('{{ notifications_rows }}', rowsString)
                callback(content)
            }
        })
    }
}