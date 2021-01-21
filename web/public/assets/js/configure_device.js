function configure_device(device_id){
    formattedLangList = {}
    for(const [code, lang] of Object.entries(langCodes)){
      formattedLangList[code] = lang.name
    }

    Swal.mixin({
        input: 'select',
        inputOptions: {
            'Sélectionner la langue': formattedLangList
        },
        confirmButtonText: 'Suivant &rarr;',
        showCancelButton: true,
        progressSteps: ['1', '2']
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
          

            Swal.fire({
                title: "Changer de langue",
                text: "Configuration en cours..."
            })
            Swal.showLoading()
            $.ajax({
                url: "/api/v1/device/" + device_id + "/config",
                type: "POST",
                data: "from_lang=" + result.value[0] + "&to_lang=" + result.value[1],
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