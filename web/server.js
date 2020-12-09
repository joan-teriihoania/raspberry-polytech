const express = require('express')
const server = express()
const fs = require('fs');
const fm = require('./fileManager');
var cookieParser = require('cookie-parser'); // module for parsing cookies
const { nextTick } = require('process');
const { encrypt, decrypt } = require('./crypto');
const sqlite = require('sqlite3')
const db = require('./db')
const googleutils = require('./googleutils')
const auth = require('./auth')
const dotenv = require('dotenv');
dotenv.config();

var database = db.createDB()
var routes = {}
var api_path_pref = "/api/v1"

/*
  Read the router.json file to retrieve data about the routes
  and path for the website to load their views
*/
server.use(cookieParser());
server.use(express.static('public'));
server.use(express.json());       // to support JSON-encoded bodies
server.use(express.urlencoded()); // to support URL-encoded bodies

bannedIps = {}
warnedIps = {}
loggerRequest = {}

setInterval(function(){
    loggerRequest = {}
}, 1000)

setInterval(function(){
    warnedIps = {}
}, 5000)

setInterval(function(){
    bannedIps = {}
}, 1*60*60*1000) // hour

/* ROUTES */
server.all('*', function(req, res, next){
    res.ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.connection.remoteAddress
    if(bannedIps[res.ip]){
        res.status(429)
        return
    }

    if(!loggerRequest[res.ip] || isNaN(loggerRequest[res.ip])){ loggerRequest[res.ip] = 0 }
    loggerRequest[res.ip] = loggerRequest[res.ip] + 1

    if(loggerRequest[res.ip] > process.env.MAX_REQUEST_PER_SECOND){
        if(warnedIps[res.ip]){
            console.log("[ANTISPAM] <BAN> " + res.ip + " has been blacklisted until next cache clear or reboot")
            bannedIps[res.ip] = new Date()
        } else {
            warnedIps[res.ip] = true
            console.log("[ANTISPAM] <WARN> Too many requests ("+loggerRequest[res.ip]+") from " + res.ip)
        }
        res.status(429)
        return
    }

    if (req.url != "" && req.url != "/" && req.url.endsWith('/')) {
        res.redirect(req.url.substr(0, req.url.length - 1))
        return
    }
    
    update_auth(req, res).then(() => {
        if(req.path.substr(0, api_path_pref.length) == api_path_pref){
            api_info = routes['api'][req.method][req.path.replace(api_path_pref, '')]
            if(api_info == undefined){
                var req_path = req.path.split('/')

                for(const [path, content] of Object.entries(routes['api'][req.method])){
                    var api_path = (api_path_pref + path).split('/')
                    if(req_path.length == api_path.length){
                        var loaded_api_path = []
                        var loaded_req_path = []

                        for(var i = 0; i < api_path.length; i++){
                            if(!api_path[i].startsWith(':')){
                                loaded_api_path.push(api_path[i])
                                loaded_req_path.push(req_path[i])
                            }
                        }

                        if(loaded_api_path.join('/') == loaded_req_path.join('/')){
                            api_info = routes['api'][req.method][path]
                        }
                    }
                }

                if(api_info == undefined){
                    res.status(404)
                    res.end("Cannot link " + req.method + " "+req.url+" to any API script")
                    return
                }
            }

            if(!res.user.is_auth && api_info.login){
                res.status(401)
                res.end("Echec d'authentification : Vous devez être connecté pour accéder à cette page ou faire cette action.")
                return
            }
        }

        next()
    })
})

server.get('*', function(req, res, next){
    if(req.path.substr(0, api_path_pref.length) == api_path_pref){
        next()
        return
    }

    var view_info = undefined
    var req_path = req.path.split('/')
    for (const [path, content] of Object.entries(routes['views'])) {
        if(path == req.path || "/ajax" + path == req.path){
            view_info = routes['views'][path]
        }
        
        var view_path = (path).split('/')
        if(req_path.length == view_path.length){
            var loaded_view_path = []
            var loaded_req_path = []

            for(var i = 0; i < view_path.length; i++){
                if(!view_path[i].startsWith(':')){
                    loaded_view_path.push(view_path[i])
                    loaded_req_path.push(req_path[i])
                }
            }

            if(loaded_view_path.join('/') == loaded_req_path.join('/')){
                view_info = routes['views'][path]
            }
        }
    }

    if(!view_info){
        res.status(404)
        render_page({"filename": "404", "title": "Page introuvable"}, req, res)
        return
    }

    if(!res.user.is_auth && view_info['login']){
        res.status(401)
        render_page({"filename": "login", "title": "Connexion"}, req, res)
        return
    }

    // if(res.user.is_auth){ console.log("[MONITOR] ("+res.user.username+"@"+res.user.user_id+"-"+res.ip+") >> " + req.path) }
    next()
})

server.listen(process.env.PORT, function(){
    console.log("[EXPRESS] Server listening on port " + process.env.PORT)
    fs.readFile("./database_template.json", function(err, database_template){
        database_template = JSON.parse(database_template.toString())
        for (const [tablename, rows] of Object.entries(database_template)) {
            console.log("[DB-CONFIG] Table " + tablename + " configured")
            db.createTable(database, tablename, rows)
        }

        db.select(database, "SELECT * FROM users WHERE username = 'Arcadia_sama' OR username = 'joan.teriihoania' OR username = 'zahra.ahlal'", function(rows){
            if(!rows){
                db.insert(database, "users", [
                    {
                        "username": "Arcadia_sama",
                        "password": "123",
                        "email": "joprocorp@gmail.com",
                        "level": 5,
                        "img_profile": "",
                        "auth_google": true
                    },
                    {
                        "username": "joan.teriihoania",
                        "password": "raspberry",
                        "email": "joan.teriihoania@etu.umontpellier.fr",
                        "level": 5,
                        "img_profile": "",
                        "auth_google": false
                    },
                    {
                        "username": "zahra.ahlal",
                        "password": "raspberry",
                        "email": "zahra.ahlal@etu.umontpellier.fr",
                        "level": 5,
                        "img_profile": "",
                        "auth_google": false
                    }
                ])
            }
        })
    })
})




// LOADING ROUTING PATH


fs.readFile("./router.json", function(err, routerContent){
    routes = JSON.parse(routerContent)

    for (const [path, content] of Object.entries(routes['views'])) {
        console.log("[ROUTER] View '" + content['filename'] + "' linked to '" + path + "' and '/ajax" + path + "'")
        server.get(path, function(req, res) {
            render_page(content, req, res)
        });
        
        server.get("/ajax" + path, function(req, res) {
            render_page(content, req, res, false)
        });
    }

    for (const [path, content] of Object.entries(routes['api']['POST'])) {
        console.log("[ROUTER] API '" + content['filename'] + "' linked to <POST> '" + api_path_pref + path + "'")
        server.post(api_path_pref + path, function(req, res) {
            var temp = require("./api/" + content['filename'])
            temp.exec(req, res)
        });
    }

    for (const [path, content] of Object.entries(routes['api']['GET'])) {
        console.log("[ROUTER] API '" + content['filename'] + "' linked to <GET> '" + api_path_pref + path + "'")
        server.get(api_path_pref + path, function(req, res) {
            var temp = require("./api/" + content['filename'])
            temp.exec(req, res)
        });
    }
})


// FUNCTIONS

function update_auth(req, res){
    return new Promise(function(resolve, reject){
        var auth_ = req.cookies["JZ-Translation-auth"]
        if (!auth_ || auth_ == "undefined"){
            var auth_ = encrypt("{}")
            res.cookie("JZ-Translation-auth", auth_)
        }

        var user = JSON.parse(decrypt(auth_))
        res.user = {
            username: "",
            img_profile: "/assets/img/avatars/none.png",
            email: "",
            level: 0,
            is_auth: false
        }
        
        auth.is_auth(database, user, function(is_auth, info){
            res.user.is_auth = is_auth
            if(is_auth){
                for (const [key, value] of Object.entries(info)) {
                    if(key != "password"){
                        res.user[key] = value
                    }
                }
                
                if(res.user.img_profile == ""){
                    res.user.img_profile = "/assets/img/avatars/none.png"
                }
            }

            resolve()
        })
    })
}

function render_page(view, req, res, use_framework=true){
    fs.readFile("./views/framework.html", function(err, framework){
        if(use_framework){
            framework = framework.toString()
        } else {
            framework = "{{ page }}"
        }
        fs.readFile("./views/pages/" + view['filename'] + ".html", function(err, page){
            if(!err){
                fs.stat('./views/controllers/' + view['filename'] + ".js", function(err, stats){
                    if(!err){
                        var pageController = require('./views/controllers/' + view['filename'])
                        page = pageController.format(page.toString(), req, res)
                        if(page == false){
                            return
                        }
                    }

                    var elementsFolder = "./views/elements/"
                    framework = replaceAll(framework, '{{ page }}', page)
    
                    fs.readdir(elementsFolder, (err, elementsFiles) => {
                        fm.readFiles(elementsFiles.map(val => elementsFolder + val), function(dataElementFiles){
                            let loadElements = []
    
                            for (const [filename, content] of Object.entries(dataElementFiles)) {
                                if(filename.substring(filename.length - 2) == "js"){
                                    var elementController = require(filename)
                                    
                                    var filenameAlone = filename.split("/")
                                    filenameAlone = filenameAlone[filenameAlone.length-1]
                                    loadElements.push(new Promise(function(resolve, reject){
                                        var keyword = filenameAlone.substring(0, filenameAlone.length - 3)
                                        elementController.format(dataElementFiles[filename.substring(0, filename.length - 2) + "html"], req, res, function(elementContentGene){
                                            framework = replaceAll(framework, '{{ '+keyword+' }}', elementContentGene)
                                            resolve()
                                        })
                                    }))
                                }
                            }
                
                            Promise.all(loadElements)
                              .then(() => { // all done!
                                for (const [key, value] of Object.entries(res.user)) {
                                    framework = replaceAll(framework, '{{ data:user.'+key+' }}', res.user[key])
                                }
                                
                                framework = replaceAll(framework, '{{ page_title }}', view['title'])
                                framework = replaceAll(framework, '{{ google_auth_url }}', googleutils.getAuthURL())

                                fs.readdir("./public/assets/js", (err, js_scripts) => {
                                    js_scripts_embed = ""
                                    for(js_script of js_scripts){
                                        js_scripts_embed += '<script src="/assets/js/'+js_script+'"></script>\n'
                                    }
    
                                    framework = replaceAll(framework, '{{ js_script }}', js_scripts_embed)
                                    res.send(framework)
                                })
                              })
                        })
                    });
                })
            }
        })
    })
}

function replaceAll(str,replaceWhat,replaceTo){
    var re = new RegExp(replaceWhat, 'g');
    return str.replace(re,replaceTo);
}

module.exports = {
    database,
    update_database: function(newdatabase){
        database = newdatabase
    }
}