var notificationItemTemplate =
    '<a class="d-flex align-items-center dropdown-item" onclick="notif_mark_seen(this, {{ notif_id }})">'+
    '    <div class="mr-3">'+
    '        <div class="bg-{{ type }} icon-circle"><i class="fas fa-{{ icon }} text-white"></i></div>'+
    '    </div>'+
    '    <div><span class="small text-gray-500"><b>{{ time }}</b></span>'+
    '        <p class="medium">{{ content }}</p>'+
    '    </div>'+
    '</a>';

var notificationsDisplayed = {}

function notif_mark_seen(elt, notif_id){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", "/api/v1/account/notifications/" + notif_id, false );
    xmlHttp.send( null );
    elt.remove()
    delete notificationsDisplayed[notif_id]
}

function update_notification_list(popup = false){
    if($('#notifications-list')){
        $.ajax({
            url: "/api/v1/account/notifications",
            statusCode: {
                200: function(response) {
                    $('#notifications-connection-lost').hide()
                    var innerHTML = ""
                    if(typeof(response) != "object") { return }
                    for(notification of response){
                        if(notification.seen == 1){ continue }
                        if(notificationsDisplayed[notification.notif_id] == undefined){
                            notificationsDisplayed[notification.notif_id] = notification
                            if(popup){toastr[notification.type]("<b>Notification reçue</b><br>" + notification.content)}
                        }
                    }

                    for(var i = Object.keys(notificationsDisplayed).length-1; i >= 0; i--){
                        var notification = notificationsDisplayed[Object.keys(notificationsDisplayed)[i]]
                        innerHTML += notificationItemTemplate
                            .replace(/{{ notif_id }}/gi, notification.notif_id)
                            .replace(/{{ link }}/gi, notification.link)
                            .replace(/{{ type }}/gi, notification.type)
                            .replace(/{{ icon }}/gi, notification.icon)
                            .replace(/{{ time }}/gi, notification.created_at)
                            .replace(/{{ content }}/gi, notification.content)
                    }
                    
                    if(Object.keys(notificationsDisplayed).length == 0){
                        $('#notifications-none').show()
                    } else {
                        $('#notifications-none').hide()
                    }

                    $('#notifications-count').html(Object.keys(notificationsDisplayed).length == 0 ? "" : Object.keys(notificationsDisplayed).length)
                    $('#notifications-list').html(innerHTML)
                },
            },
            error: function(){
                $('#notifications-connection-lost').show()
            }
        });
    }
}

update_notification_list()
setInterval(function(){
    update_notification_list(true)
}, 1000)