const express = require('express')
const server = express()
const fs = require('fs');
const fm = require('./fileManager');
var cookieParser = require('cookie-parser'); // module for parsing cookies
const { nextTick } = require('process');
const { encrypt, decrypt } = require('./crypto');

const PORT = 3000
var routes = {}
var users = {}
var api_path_pref = "/api/v1"

/*
  Read the router.json file to retrieve data about the routes
  and path for the website to load their views
*/
server.use(cookieParser());
server.use(express.static('public'));
server.use(express.json());       // to support JSON-encoded bodies
server.use(express.urlencoded()); // to support URL-encoded bodies


fs.readFile("./router.json", function(err, routerContent){
    routes = JSON.parse(routerContent)
    for (const [path, content] of Object.entries(routes['views'])) {
        server.get(path, function(req, res) {
            render_page(content, req, res)
        });
    }

    for (const [path, content] of Object.entries(routes['api']['POST'])) {
        server.post(api_path_pref + path, function(req, res) {
            var temp = require("./api/" + content['filename'])
            temp.exec(req, res)
        });
    }

    for (const [path, content] of Object.entries(routes['api']['GET'])) {
        server.get(api_path_pref + path, function(req, res) {
            var temp = require("./api/" + content['filename'])
            temp.exec(req, res)
        });
    }
})

fs.readFile("./users.json", function(err, routerContent){
    users = JSON.parse(routerContent)
})

server.all('*', function(req, res, next){
    update_auth(req, res)
    next()
})

server.get('*', function(req, res, next){
    if(req.path.substr(0, api_path_pref.length) == api_path_pref){
        next()
        return
    }

    var routeExist = false
    for (const [path, content] of Object.entries(routes['views'])) {
        if(path == req.path){
            routeExist = true
        }
    }

    if(!res.user.is_auth){
        render_page({"filename": "login", "title": "Connexion"}, req, res)
        return
    }

    if(!routeExist){
        res.status(404)
        render_page({"filename": "404", "title": "Page introuvable"}, req, res)
        return
    }

    next()
})

server.listen(PORT)



// FUNCTIONS

function update_auth(req, res){
    res.user = {
        username: "",
        img_profile: "",
        level: 0,
        is_auth: false
    }

    var auth0 = req.cookies["JZ-Translation-auth0"]
    var auth1 = req.cookies["JZ-Translation-auth1"]
    if (!auth0 || !auth1){
        res.cookie("JZ-Translation-auth0", encrypt(""))
        res.cookie("JZ-Translation-auth1", encrypt(""))
    } else {
        username = decrypt(auth0)
        password = decrypt(auth1)
        for (const [r_username, r_user_data] of Object.entries(users)) {
            if(username == r_username && r_user_data['password'] == password){
                for (const [key, value] of Object.entries(r_user_data)) {
                    if(key != "password"){
                        res.user[key] = value
                    }
                }
                res.user.is_auth = true
            }
        }
    }
}

function render_page(view, req, res){
    fs.readFile("./views/framework.html", function(err, framework){
        var framework = framework.toString()
        framework = framework.replace('{{ page_title }}', view['title'])
        fs.readFile("./views/pages/" + view['filename'] + ".html", function(err, page){
            if(!err){
                var pageController = require('./views/controllers/' + view['filename'])
                var page = pageController.format(page.toString(), req, res)
                var elementsFolder = "./views/elements/"
                framework = framework.replace('{{ page }}', page)

                fs.readdir(elementsFolder, (err, elementsFiles) => {
                    fm.readFiles(elementsFiles.map(val => elementsFolder + val), function(dataElementFiles){
                        for (const [filename, content] of Object.entries(dataElementFiles)) {
                            if(filename.substring(filename.length - 2) == "js"){
                                var elementController = require(filename)
                                
                                var filenameAlone = filename.split("/")
                                filenameAlone = filenameAlone[filenameAlone.length-1]
                                var keyword = filenameAlone.substring(0, filenameAlone.length - 3)

                                framework = framework.replace(
                                    '{{ '+keyword+' }}',
                                    elementController.format(
                                        dataElementFiles[filename.substring(0, filename.length - 2) + "html"]
                                        , req, res
                                    )
                                )
                            }
                        }
                        res.send(framework)
                    })
                });
            }
        })
    })
}