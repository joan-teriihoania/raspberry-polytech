function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function isURL(string) {
    let url;
    
    try {
      url = new URL(string);
    } catch (_) {
      return false;  
    }
  
    return url.protocol === "http:" || url.protocol === "https:";
}

function beautifyJSON(json, tab = 0){
    if(json.constructor == ({}).constructor) {json = JSON.stringify(json)}
    if(json.constructor == ([]).constructor) {json = JSON.stringify(json)}
    if(json == "true" || json == "false") return json
    if(json == true || json == false) return "" + json
    if(Number.isInteger(json)) return "" + json
    if(isURL(json)) return "<a href='"+json+"' target='_blank' class='text-dark'><u><i class='fas fa-external-link-alt'></i></u></a>"
    if(!isJson(json)) return '"<i>' + json + '</i>"'
    data = JSON.parse(json)
    toreturn = "{\n"

    if(Object.keys(data).length == 0) return "{}"

    for(const [key, value] of Object.entries(data)){
        toreturn += "&nbsp;".repeat(tab + 2) + "<b>\"" + key + "\"</b>: " + beautifyJSON(value, tab + 2) + ",\n"
    }

    return toreturn + "&nbsp;".repeat(tab) +  "}"
}

function api_send_ajax(method, url, data_class_elt, output_elt, btn = undefined){
    url += "?"
    data_elts = $('.' + data_class_elt)
    fields = {}
    for(data_elt of data_elts){
        fields[data_elt.name] = data_elt.value
    }

    dataform = new FormData()
    for(const [field, value] of Object.entries(fields)){
        if(method == "POST"){
            dataform.append(field, value)
        } else {
            url += field + "=" + encodeURI(value) + "&"
        }
    }

    var btnVal = ""
    if(btn != undefined){
        btn.disabled = true
        btnVal = btn.innerHTML
        btn.innerHTML = "<i class='fas fa-circle-notch fa-spin'></i>"
    }
    

    $.ajax({
        url: url,
        type: method,
        data: dataform,
        contentType: false,
        processData: false,
        complete: function(xhr, status){
            if(btn != undefined){
                btn.innerHTML = btnVal
                btn.disabled = false
            }
            var output = ""
            if(xhr.status == 200){
                $('.' + output_elt).addClass('bg-success')
                $('.' + output_elt).removeClass('bg-danger')
                output = beautifyJSON(xhr.responseText)
                    .replace(/\n/gi, '<br>')
            } else {
                $('.' + output_elt).addClass('bg-danger')
                $('.' + output_elt).removeClass('bg-success')
                output = xhr.responseText
            }
            
            if(output != "" && output != undefined){
               $('.' + output_elt).html("<p class='alert alert-info text-center mt-0 mb-0 pt-0 pb-0'><b>Statut de la requête: " + xhr.status + "</b></p><br><code class='text-white'>" + output + "</code>")
            } else {
                $('.' + output_elt).html("Aucune réponse n'a été retournée par l'API")
            }
            Swal.close()
        },
    });
}