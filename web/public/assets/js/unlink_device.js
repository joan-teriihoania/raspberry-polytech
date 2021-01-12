function unlink_device(device_id){
    $.ajax({
        url: "/api/v1/device/" + device_id + "/unlink",
        type: "POST",
        complete: function(){
            Swal.close()
        },
        statusCode: {
            200: function(response, status, xhr) {
                toastr.success('Appareil ' + response.device_id + " supprimé !")
            }
        },
        error: function(xhr, status, err){
            toastr.error("<b>Echec de la suppression</b><br>" + (xhr.responseText ? xhr.responseText : "Une erreur inconnue s'est produite"))
        }
    });
}