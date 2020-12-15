var authChecker = setInterval(function(){
    if(!$('#user-auth-controller').length > 0) {
        return
    }

    ajax_authChecker(function(response, status, xhr){
        if(!response.is_auth){
            setTimeout(ajax_authChecker(function(response, status, xhr){
                if(!response.is_auth){
                    stop_authChecker()
                    Swal.fire({
                        icon: "warning",
                        title: "Vous avez été déconnecté",
                        text: "L'authentification au serveur a échoué. La majorité des fonctionnalités de la page vont cesser de fonctionner correctement.",
                        footer: '<div class="alert alert-warning" role="alert">Enregistrez votre travail sur un support extérieur puis rechargez la page pour vous reconnecter.</div>',
                    })
                }
            }), 1000)
        }
    })
}, 5000)

function ajax_authChecker(callback){
    $.ajax({
        url: "/api/v1/ping",
        statusCode: {
            200: function(response, status, xhr) {
                callback(response, status, xhr)
            }
        }
    });
}

function stop_authChecker(){
    clearInterval(authChecker)
}