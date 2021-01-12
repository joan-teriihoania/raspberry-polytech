const fs = require('fs')

module.exports = {
    format: function(content, req, res, ressources, callback){
        fs.readFile("./router.json", function(err, routerContent){
            routes = JSON.parse(routerContent.toString())
            var rowsString = ""
        
            for (const [method, apis] of Object.entries(routes['api'])) {
                for (const [path, content] of Object.entries(apis)) {
                    var elt_id = method + "-" + path.replace(/\//gi, "-").replace(/:/gi, "")
                    if(content.admin) continue
                    if(!content.description) continue
                    if(ressources['apiRowsTemplate.html'] == undefined){
                        res.status(500)
                        callback("Une erreur interne s'est produite lors du chargement de la page : <br><code>" + JSON.stringify(ressources) + "</code>")
                        return
                    }

                    rowsString += ressources['apiRowsTemplate.html']
                        .replace(/{{ method_color_type }}/gi, (method == "GET" ? "warning" : "success"))
                        .replace(/{{ method }}/gi, method)
                        .replace(/{{ elt_id }}/gi, elt_id)
                        .replace(/{{ login }}/gi, '<span class="input-group-text bg-white text-'+(content.login ? 'danger' : "success")+'">' + (content.login ? '<i class="fas fa-lock"></i>' : '<i class="fas fa-lock-open"></i>') + "</span>")
                        .replace(/{{ path }}/gi, process.env.API_PATH_PREF + path)
                    
                    var description = {}
                    var descriptionString = ""
                    var formInputParams = ""

                    description['Description'] = content.description
                    if(content.params){
                        description["Paramètres"] = "<code>" + content.params.join(', ') + "</code>"
                        for(var param of content.params){
                            formInputParams += "<div class='form-group'><input class='form-control "+elt_id+"-param' name='"+param+"' placeholder='"+param+"' /></div>"
                        }
                    }

                    rowsString = rowsString.replace(/{{ form_params_inputs }}/gi, (formInputParams == "" ? "Aucun paramètre" : formInputParams))

                    if(content.return){
                        description['Succès'] = "<code>" + content.return.success + "</code>"
                        description['Erreur'] = "<code>" + content.return.error + "</code>"
                    }

                    descriptionString += "<table class='mt-1 table bg-white table-striped'><tbody>"
                    for(const [field, content] of Object.entries(description)){
                        descriptionString += "<tr><th scope='row'>"+field+"</th><td>"+content+"</td></tr>"
                    }
                    descriptionString += "</tbody></table>"

                    rowsString = rowsString.replace(/{{ description }}/gi, descriptionString)
                }
            }

            callback(content.replace(/{{ api_rows }}/gi, rowsString))
        })
    }
}