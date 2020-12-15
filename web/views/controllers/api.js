const fs = require('fs')

var apiRowsTemplate =
    '<div class="card-body"><div class="row mt-3">'+
    '    <div class="col">'+
    '        <div class="form-group">'+
    '            <div class="input-group">'+
    '                <div class="input-group-prepend">'+
    '                   {{ method }}'+
    '                </div>'+
    '                <input class="form-control" type="text" name="auth_key" value="{{ path }}" disabled>'+
    '                <div class="input-group-append">'+
    '                   {{ login }}'+
    '                </div>'+
    '            </div>'+
    '        </div>'+
    '        <div class="card bg-gray-200">'+
    '            <div class="card-body pt-2 pb-2">'+
    '                {{ description }}'+
    '            </div>'+
    '        </div>'+
    '    </div>'+
    '</div></div>'


module.exports = {
    format: function(content, req, res, callback){
        fs.readFile("./router.json", function(err, routerContent){
            routes = JSON.parse(routerContent.toString())
            var rowsString = ""
        
            for (const [method, apis] of Object.entries(routes['api'])) {
                for (const [path, content] of Object.entries(apis)) {
                    if(content.admin) continue
                    if(!content.description) continue

                    var type = (method == "GET" ? "warning" : "success")
                    rowsString += apiRowsTemplate
                        .replace(/{{ method }}/gi, '<div class="input-group-text bg-'+type+' text-white">'+method + "</div>")
                        .replace(/{{ login }}/gi, '<span class="input-group-text bg-white text-'+(content.login ? 'danger' : "success")+'">' + (content.login ? '<i class="fas fa-lock"></i>' : '<i class="fas fa-lock-open"></i>') + "</span>")
                        .replace(/{{ path }}/gi, process.env.API_PATH_PREF + path)
                    
                    var fields = {}
                    var description = ""

                    fields['Description'] = content.description
                    if(content.params){fields["Paramètres"] = "<code>" + content.params.join(', ') + "</code>"}
                    if(content.return){
                        fields['Succès'] = "<code>" + content.return.success + "</code>"
                        fields['Erreur'] = "<code>" + content.return.error + "</code>"
                    }

                    description += "<table class='mt-1 table bg-white table-striped'><tbody>"
                    for(const [field, content] of Object.entries(fields)){
                        description += "<tr><th scope='row'>"+field+"</th><td>"+content+"</td></tr>"
                    }
                    description += "</tbody></table>"

                    rowsString = rowsString.replace(/{{ description }}/gi, description)
                }
            }

            callback(content.replace(/{{ api_rows }}/gi, rowsString))
        })
    }
}