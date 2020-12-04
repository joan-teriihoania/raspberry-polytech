const express = require('express')
const server = express()
const fs = require('fs')
const PORT = 3000

/*
  Read the router.json file to retrieve data about the routes
  and path for the website to load their views
*/
server.use(express.static('public'));

fs.readFile("./router.json", function(err, routerContent){
    routes = JSON.parse(routerContent)
    for (const [path, content] of Object.entries(routes)) {
        server.get(path, function(req, res) {
            fs.readFile("./views/" + content['filename'], function(err, viewContent){
                var viewContent = viewContent.toString()
                var elementsFolder = "./views/elements/"

                fs.readdir(elementsFolder, (err, elementsFiles) => {
                    for(elementFile of elementsFiles){
                        elementContent = fs.readFileSync(elementsFolder + elementFile)
                        viewContent = viewContent.replace('{{ '+elementFile+' }}', elementContent)
                    }
                    res.end(viewContent)
                });
            })
        });
    }
})


server.listen(PORT)