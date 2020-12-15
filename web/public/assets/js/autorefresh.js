var autorefresh_save = ''

setInterval(function(){  
    if(Swal.isVisible()) return  
    $.ajax({
        url: "/ajax" + document.location.pathname,
        type: "GET",
        complete: function(){
            Swal.close()
        },
        statusCode: {
            200: function(response, status, xhr) {
                if(response == autorefresh_save) return
                autorefresh_save = response
                $('#page_container').html(response)
            }
        }
    });
}, 1000)