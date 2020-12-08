function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
          tmp = item.split("=");
          if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

var authChecker = setInterval(function(){
    if(!$('#user-auth-controller').length > 0) {
        return
    }

    $.ajax({
        url: "/api/v1/ping",
        statusCode: {
            200: function(response, status, xhr) {
                if(!response.is_auth){
                    stop_authChecker()
                    Swal.fire({
                        icon: "warning",
                        title: "Vous avez été déconnecté",
                        text: "L'authentification au serveur a échoué. La majorité des fonctionnalités de la page vont cesser de fonctionner correctement.",
                        footer: '<div class="alert alert-warning" role="alert">Enregistrez votre travail sur un support extérieur puis rechargez la page pour vous reconnecter.</div>',
                    })
                }
            }
        }
    });
}, 1000)

function stop_authChecker(){
    clearInterval(authChecker)
}