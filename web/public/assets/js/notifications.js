var notificationItemTemplate =
    '<a class="d-flex align-items-center dropdown-item" href="{{ link }}">'+
    '    <div class="mr-2">'+
    '        <div class="bg-{{ type }} icon-circle"><i class="fas fa-{{ icon }} text-white"></i></div>'+
    '    </div>'+
    '    <div><span class="small text-gray-500">{{ time }}</span>'+
    '        <p>{{ content }}</p>'+
    '    </div>'+
    '</a>';

var loadingAnimation = '<div class="d-flex dropdown-item justify-content-center" id="notifications-loading"><i class="fas fa-circle-notch fa-spin"></i></div>'
var notificationsDisplayed = {}
var notificationsLoaded = false

setInterval(function(){
    if($('#notifications-list')){
        $.ajax({
            url: "/api/v1/profile/notifications",
            statusCode: {
                200: function(response) {
                    $('#notifications-connection-lost').hide()
                    var innerHTML = ""
                    if(typeof(response) != "object") { return }
                    for(notification of response){
                        if(!(notification.notif_id in notificationsDisplayed)){
                            notificationsDisplayed[notification.notif_id] = notification

                            if(notificationsLoaded){
                                toastr[notification.type]("<b>Notification reçue</b><br>" + notification.content)
                            }
                        }
                    }

                    for(var i = Object.keys(notificationsDisplayed).length-1; i >= 0; i--){
                        var notification = notificationsDisplayed[Object.keys(notificationsDisplayed)[i]]
                        innerHTML += notificationItemTemplate
                            .replace("{{ link }}", notification.link)
                            .replace("{{ type }}", notification.type)
                            .replace("{{ icon }}", notification.icon)
                            .replace("{{ time }}", notification.created_at)
                            .replace("{{ content }}", notification.content)
                    }
                    $('#notifications-count').html(Object.keys(notificationsDisplayed).length)
                    $('#notifications-list').html(innerHTML)
                    notificationsLoaded = true
                },
            },
            error: function(){
                $('#notifications-connection-lost').show()
            }
        });
    }
}, 1000)