function configure_device(device_id){
    Swal.mixin({
        input: 'text',
        confirmButtonText: 'Suivant &rarr;',
        showCancelButton: true,
        progressSteps: ['1', '2', '3']
      }).queue([
        {
          title: 'Langue source',
          text: 'Assurez-vous que votre appareil est allumé et en ligne avant de reconfigurer les langues !'
        },
        {
          title: 'Langue destination',
          text: 'Assurez-vous que votre appareil est allumé et en ligne avant de reconfigurer les langues !'
        }
      ]).then((result) => {
        if (result.value) {
            const answers = JSON.stringify(result.value)
          

            Swal.fire({
                title: "Changer de langue",
                text: "Configuration en cours..."
            })
            Swal.showLoading()
            
            $.ajax({
                url: "/api/v1/device/" + device_id + "/config",
                type: "POST",
                data: "from_lang=" + answers[0] + "&to_lang=" + answers[1],
                complete: function(){
                    Swal.close()
                },
                statusCode: {
                    200: function(response, status, xhr) {
                        toastr.success('Configuration mise à jour !')
                    }
                },
                error: function(xhr, status, err){
                    toastr.error("<b>Echec de configuration</b><br>" + (xhr.responseText ? xhr.responseText : "Une erreur inconnue s'est produite"))
                }
            });
        }
      })
}