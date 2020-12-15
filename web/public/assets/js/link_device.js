function link_device(){
    Swal.fire({
        title: "Ajouter un appareil",
        html: "Appuyez sur le bouton 'Valider' de votre traducteur jusqu'à ce que l'écran affiche un code PIN.<br><br><b>Entrez le code PIN ci-dessous:</b>",
        input: 'text',
        showCancelButton: true,
        inputValidator: (value) => {
            if (!value) {
                return 'Vous n\'avez pas spécifié de code PIN'
            }

            Swal.fire({
                title: "Ajouter un appareil",
                html: "Vérification en cours..."
            })
            Swal.showLoading()
          
            $.ajax({
                url: "/api/v1/device/bind",
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