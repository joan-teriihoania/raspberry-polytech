function configure_device(device_id){
    Swal.fire({
        title: "Changer la langue",
        html: "Assurez-vous que votre appareil est allumé et en ligne avant de reconfigurer les langues !<br><br><b>Entrez la langue source:</b>",
        input: 'text',
        showCancelButton: true,
        inputValidator: (value) => {
            if (!value) {
                return 'Vous n\'avez pas spécifié de langue source'
            }

            Swal.fire({
                title: "Ajouter un appareil",
                html: "Vérification en cours..."
            })
            Swal.showLoading()
          
            $.ajax({
                url: "/api/v1/device/link",
                type: "POST",
                data: "pin_code=" + value,
                complete: function(){
                    Swal.close()
                },
                statusCode: {
                    200: function(response, status, xhr) {
                        toastr.success('Nouvel appareil ajouté avec succès !')
                    }
                },
                error: function(xhr, status, err){
                    toastr.error("<b>Echec de l'ajout</b><br>" + (xhr.responseText ? xhr.responseText : "Une erreur inconnue s'est produite"))
                }
            });
        }
    })
}