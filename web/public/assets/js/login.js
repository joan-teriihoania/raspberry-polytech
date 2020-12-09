function send_login_ajax(api_url){
    $("#login-form-submit").html('<i class="fas fa-circle-notch fa-spin"></i>')
    $("#login-form-submit").prop('disabled', true)
    $.ajax({
        url: api_url,
        complete: function(data){
            $("#login-form-submit").html('Se connecter')
            $("#login-form-submit").prop('disabled', false)
        },
        statusCode: {
            200: function(response) {
                Swal.fire({
                    title:"Connecté en tant que <br>" + response.username,
                    icon:"success",
                    text: "Vous serez redirigé dans quelques instants...",
                })
                Swal.showLoading()
                setTimeout(function(){
                    location.reload()
                }, 2000)
            },
            401: function(xhr, status, err) {
                toastr.error("<b>Echec d'authentification</b><br>Identifiants incorrectes")
            }
        },
        error: function(xhr, status, err){
            if(xhr.status != 401){
                toastr.error("Nous rencontrons des difficultés techniques. Réessayez plus tard.")
            }
        }
    });
}


if($('#login-form').length > 0){
    var code = findGetParameter("code")
    if(code && window.location.pathname == "/login/google"){
        send_login_ajax("/api/v1/login?code=" + encodeURI(code))
    }
    

    $('#login-form').on('submit', function(e) {
        e.preventDefault();
        send_login_ajax("/api/v1/login?email=" + encodeURI($('#login-form-email').val()) + "&password=" + encodeURI($('#login-form-password').val()))
    });
}