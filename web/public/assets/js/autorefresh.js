var autorefresh_save = ''

setInterval(function(){
    $.ajax({
        url: "/ajax" + document.location.pathname,
        type: "GET",
        statusCode: {
            200: function(response, status, xhr) {
                if(response == autorefresh_save) return
                autorefresh_save = response
                $('#page_container').html(response)
            }
        }
    });
}, 1000)