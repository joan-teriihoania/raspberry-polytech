module.exports = {
    exec: function(req, res){
        res.cookie("JZ-Translation-auth0", "")
        res.cookie("JZ-Translation-auth1", "")
        res.redirect('/')
    }
}