if($('#edit-user-info-profile').length > 0){
    $('#edit-user-info-profile').on('submit', function(e) {
        e.preventDefault();
        var fields = {}
        for(element of $(".edit-user-info-profile-data")){
            fields[element.name] = element
        }

        $("#edit-user-info-profile-submit").html('<i class="fas fa-circle-notch fa-spin"></i>')
        $("#edit-user-info-profile-submit").prop('disabled', true)
        edit_profile(fields, function(){
            $("#edit-user-info-profile-submit").html('Enregistrer')
            $("#edit-user-info-profile-submit").prop('disabled', false)
        })
    });
}


function select_photo(file_elt){
    file_elt.trigger('click');
}

function edit_profile(elements, callback=() => {}){
    var fd = new FormData();
    var img_profile = false

    for(element in elements){
        if(element == "img_profile"){
            var file_elt = elements[element]
            var files = file_elt.files;
            
            // Check file selected or not
            if(files.length > 0 ){
                img_profile = true
                fd.append('img_profile', files[0]);
            }
        } else {
            fd.append(element, elements[element].value)
        }
    }

    send_ajax_edit_profile(fd, img_profile, callback)
}

function send_ajax_edit_profile(fd, showSweet=false, callback){
    if(showSweet){
        Swal.fire("Modification du profil", "Mise à jour en cours...")
        Swal.showLoading()
    }

    $.ajax({
        url: '/api/v1/account',
        type: 'post',
        data: fd,
        contentType: false,
        processData: false,
        complete: function(){
            if(showSweet){
                Swal.hideLoading()
            }

            callback()
        },
        statusCode: {
          500: function(xhr, status, err){
            var _title = 'Modification du profil'
            var _message = "Une erreur interne s'est produite durant la mise à jour de votre profil."
            var _info_sw = (xhr.responseText ? '<div class="alert alert-warning" role="alert">' + xhr.responseText + '</div>' : '')
            var _info_toastr = (xhr.responseText ? "<code class='text-white'>" + xhr.responseText + "</code>" : '')

            if(showSweet){
                Swal.fire({
                    icon: 'error',
                    title: _title,
                    text: _message,
                    footer: _info_sw
                })
            } else {
                toastr.error(_message + (_info_toastr != '' ? "<br><br>" + _info_toastr : ""), _title)
            }
          }
        },
        error: function(xhr, status, err){
            if(xhr.status != 500){
                var _title = 'Modification du profil'
                var _message = "Une erreur inattendue s'est produite durant la mise à jour de votre profil."
                var _info_sw = (xhr.responseText ? '<div class="alert alert-warning" role="alert">' + xhr.responseText + '</div>' : '')
                var _info_toastr = (xhr.responseText ? "<code class='text-white'>" + xhr.responseText + "</code>" : '')

                if(showSweet){
                    Swal.fire({
                        icon: 'error',
                        title: _title,
                        text: _message,
                        footer: _info_sw
                    })
                } else {
                    toastr.error(_message + (_info_toastr != '' ? "<br><br>" + _info_toastr : ""), _title)
                }
            }
        },
        success: function(response){
            Swal.close()
            toastr.success("Vos informations de profil ont été mises à jour")
            $('#user-username').html(response.username)
            if(response.img_profile != undefined){
                for(elt of $('.user-img_profile')){
                    elt.src = response.img_profile
                }
            }
        },
     });
}