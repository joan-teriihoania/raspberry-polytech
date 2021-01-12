module.exports = {
    exec: function(req, res){
        res.status(200)
        var response = {}
        response.is_auth = (res.user && res.user.is_auth)        
        res.send(response)
    }
}