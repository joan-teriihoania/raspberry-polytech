const express = require('express')
const server = express()
const fs = require('fs')
const PORT = 3000

/*
  Read the router.json file to retrieve data about the routes
  and path for the website to load their views
*/
server.use(express.static('public'));

fs.readFile("./router.json", function(err, data){
    routes = JSON.parse(data)
    for (const [path, content] of Object.entries(routes)) {
        server.get(path, function(req, res) {
            fs.readFile("./views/" + content['filename'], function(err, data){
                res.end(data)
            })
        });
    }
})

server.listen(PORT)