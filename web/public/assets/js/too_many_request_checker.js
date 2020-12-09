var tooManyRequestsChecker = setInterval(function(){
    if(XMLHttpRequest.getResponseHeader('JZ-Translation-antispam') != "WARN") {
        return
    }

    $.ajax({
        url: "/api/v1/ping",
        statusCode: {
            200: function(response, status, xhr) {
                if(!response.is_auth){
                    stop_tooManyRequestsChecker()
                    Swal.fire({
                        icon: "warning",
                        title: "Anti-spam",
                        text: "Vous envoyez trop de requête au serveur. Votre adresse a été placée en liste d'avertissement, si vous en envoyez trop sur une trop longue durée, votre adresse IP sera blacklistée.",
                        footer: '<div class="alert alert-warning" role="alert">Veillez à n\'ouvrir qu\'un nombre strictement nécessaire d\'onglets.</div>',
                    })
                }
            }
        }
    });
}, 1000)

function stop_tooManyRequestsChecker(){
    clearInterval(tooManyRequestsChecker)
}