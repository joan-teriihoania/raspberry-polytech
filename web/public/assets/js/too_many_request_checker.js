var antiSpamWarned = false
var antiSpamBanned = false

var tooManyRequestsChecker = setInterval(function(){
    var client = new XMLHttpRequest();
    client.open("GET", "/api/v1/ping", true);
    client.send();
    
    client.onreadystatechange = function() {
      if(this.readyState == this.HEADERS_RECEIVED) {
        var contentType = client.getResponseHeader("JZ-Translation-antispam");
        var contentType = client.getResponseHeader("JZ-Translation-antispam");
        if (!antiSpamWarned && contentType == "WARN") {
            Swal.fire({
                icon: "warning",
                title: "Anti-spam",
                text: "Vous envoyez trop de requête au serveur. Votre adresse a été placée en liste d'avertissement, si vous en envoyez trop sur une trop longue durée, votre adresse IP sera blacklistée.",
                footer: '<div class="alert alert-warning" role="alert">Veillez à n\'ouvrir qu\'un nombre strictement nécessaire d\'onglets.</div>',
            })  
        }
        
        if (!antiSpamBanned && contentType == "BAN") {
            stop_tooManyRequestsChecker()
            Swal.fire({
                icon: "error",
                title: "Anti-spam",
                text: "Vous avez envoyé trop de requête au serveur et votre adresse IP a été blacklistée. Envoyez un message aux administrateurs pour que votre adresse soit réautorisée.",
                footer: '<div class="alert alert-warning" role="alert">Veillez à n\'ouvrir qu\'un nombre strictement nécessaire d\'onglets.</div>',
            })  
        }
        
        client.abort();
      }
    }
}, 1000)

function stop_tooManyRequestsChecker(){
    clearInterval(tooManyRequestsChecker)
}