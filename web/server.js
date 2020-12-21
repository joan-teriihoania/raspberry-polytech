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

/*
  Read the router.json file to retrieve data about the routes
  and path for the website to load their views
*/
server.use(cookieParser());
server.use(express.static('public'));
server.use(express.json());       // to support JSON-encoded bodies
server.use(express.urlencoded()); // to support URL-encoded bodies

loggerRequest = {}
setInterval(function(){
    loggerRequest = {}
}, 1000)


/* ROUTES */
server.all('*', function(req, res, next){
    res.ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.connection.remoteAddress

    if(!loggerRequest[res.ip] || isNaN(loggerRequest[res.ip])){ loggerRequest[res.ip] = 0 }
    loggerRequest[res.ip] = loggerRequest[res.ip] + 1

    if(loggerRequest[res.ip] > process.env.MAX_REQUEST_PER_SECOND){
        res.status(429)
        res.send("Too many requests")
        return
    }

    if (req.url != "" && req.url != "/" && req.url.endsWith('/')) {
        res.redirect(req.url.substr(0, req.url.length - 1))
        return
    }
    
    update_auth(req, res).then(() => {
        if(req.path.substr(0, process.env.API_PATH_PREF.length) == process.env.API_PATH_PREF){
            api_info = routes['api'][req.method][req.path.replace(process.env.API_PATH_PREF, '')]
            if(api_info == undefined){
                var req_path = req.path.split('/')

                for(const [path, content] of Object.entries(routes['api'][req.method])){
                    var api_path = (process.env.API_PATH_PREF + path).split('/')
                    var loaded_api_path = []
                    var loaded_req_path = []
                    for(var i = 0; i < api_path.length; i++){
                        if(api_path[i] == "*"){
                            break
                        }

                        if(!api_path[i].startsWith(':')){
                            loaded_api_path.push(api_path[i])
                            loaded_req_path.push(req_path[i])
                        } else {
                            loaded_api_path.push(req_path[i])
                            loaded_req_path.push(req_path[i])
                        }
                    }

                    if(loaded_api_path.join('/') == loaded_req_path.join('/')){
                        api_info = routes['api'][req.method][path]
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

            if(api_info.admin && req.body.auth_key != process.env.SECRET_KEY && req.query.auth_key != process.env.SECRET_KEY){
                res.status(401)
                res.end("L'accès à cet API est réservé aux administrateurs")
                return
            }
        }

        next()
    })
})

server.get('*', function(req, res, next){
    if(req.path.substr(0, process.env.API_PATH_PREF.length) == process.env.API_PATH_PREF){
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
                if(!view_path[i].startsWith(':') || !view_path[i] == "ajax"){
                    loaded_view_path.push(view_path[i])
                    loaded_req_path.push(req_path[i])
                } else {
                    loaded_view_path.push(req_path[i])
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
    
    if(res.user.is_auth && req.path.split('/')[1] != "ajax"){ console.log("[MONITOR] ("+res.user.username+"@"+res.user.user_id+"-"+res.ip+") >> " + req.path) }
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
        console.log("[ROUTER] API '" + content['filename'] + "' linked to <POST> '" + process.env.API_PATH_PREF + path + "'")
        server.post(process.env.API_PATH_PREF + path, function(req, res, next) {
            var temp = require("./api/" + content['filename'])
            temp.exec(req, res, next)
        });
    }

    for (const [path, content] of Object.entries(routes['api']['GET'])) {
        console.log("[ROUTER] API '" + content['filename'] + "' linked to <GET> '" + process.env.API_PATH_PREF + path + "'")
        server.get(process.env.API_PATH_PREF + path, function(req, res, next) {
            var temp = require("./api/" + content['filename'])
            temp.exec(req, res, next)
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
            is_auth: false
        }
        
        auth.is_auth(database, user, req, function(auth_method, info){
            res.user.is_auth = auth_method != false ? true : false
            res.user.auth_method = auth_method
            if(auth_method){
                for (const [key, value] of Object.entries(info)) {
                    if(key != "password"){
                        res.user[key] = value
                    }
                }
                
                if(res.user.img_profile == ""){
                    res.user.img_profile = "/assets/img/avatars/none.png"
                }

                db.select(database, "SELECT * FROM devices WHERE user_id = " + res.user.user_id, function(rows){
                    var promises = []
                    if(rows && rows.length > 0){
                        res.user.devices = rows
                        for(row of rows){
                            promises.push(new Promise(function(resolve, reject){
                                db.select(database, "SELECT * FROM translations WHERE device_id = " + row.device_id + 
                                " AND translated_at BETWEEN datetime('now', 'start of month') AND datetime('now', 'localtime');",
                                function(rows){
                                    if(rows && rows.length > 0){
                                        res.user.translations = rows
                                    } else {
                                        res.user.translations = []
                                    }
                                    resolve()
                                })
                            }))
                        }
                    } else {
                        res.user.devices = []
                        res.user.translations = []
                    }

                    Promise.all(promises).then(() => {
                        resolve()
                    })
                })
            } else {
                resolve()
            }

        })
    })
}

function render_page(view, req, res, use_framework=true, replaceValues = {}){
    fs.readFile("./views/framework.html", function(err, framework){
        if(use_framework){
            framework = framework.toString()
        } else {
            framework = "{{ page }}"
        }

        fs.readFile("./views/pages/" + view['filename'] + ".html", function(err, page){
            if(!err){
                var promise
                try {
                    var pageController = require('./views/controllers/' + view['filename'] + '.js')
                    promise = new Promise(function(resolve, reject){
                        var ressourceFolder = './views/pages/' + view['filename'] + '/'
                        var ressourceFilesPromise = []
                        var ressourceFiles = {}
                        if(fs.existsSync(ressourceFolder)){
                            ressourceFilesPromise.push(new Promise(function(resolve, reject){
                                fs.readdir(ressourceFolder, (err, ressourceFilesNames) => {
                                    fm.readFiles(ressourceFolder, ressourceFilesNames, function(_ressourceFiles){
                                        ressourceFiles = _ressourceFiles
                                        resolve()
                                    })
                                })
                            }))
                        }

                        Promise.all(ressourceFilesPromise).then(() => {
                            pageController.format(page.toString(), req, res, ressourceFiles, function(page){
                                resolve(page)
                            })
                        })
                    })
                } catch(err) {
                    promise = new Promise(function(resolve, reject){
                        resolve(page.toString())
                    })
                }
                
                promise.then(function(page){
                    if(page == false){return}
                    var elementsFolder = "./views/elements/"
                    framework = replaceAll(framework, '{{ page }}', page)
    
                    fs.readdir(elementsFolder, (err, elementsFiles) => {
                        fm.readFiles(elementsFolder, elementsFiles, function(dataElementFiles){
                            let loadElements = []
    
                            for (const [filename, content] of Object.entries(dataElementFiles)) {
                                var _filename = elementsFolder + filename
                                if(_filename.substring(_filename.length - 2) == "js"){
                                    var elementController = require(_filename)
                                    
                                    var filenameAlone = _filename.split("/")
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
                                    if(res.user[key] instanceof Array){framework = replaceAll(framework, '{{ data:user.'+key+'.length }}', res.user[key].length)}
                                    if(res.user[key] instanceof Object){framework = replaceAll(framework, '{{ data:user.'+key+'.length }}', Object.keys(res.user[key]).length)}
                                }

                                replaceValues['page_title'] = view['title']
    
                                for (const [key, value] of Object.entries(replaceValues)) {
                                    framework = replaceAll(framework, '{{ '+key+' }}', replaceValues[key])
                                }
    
                                fs.readdir("./public/assets/js", (err, js_scripts) => {
                                    js_scripts_embed = ""
                                    for(js_script of js_scripts){
                                        if(js_script == "autorefresh.js" && !view.autorefresh){continue}
                                        js_scripts_embed += '<script src="/assets/js/'+js_script+'"></script>\n'
                                    }
    
                                    framework = replaceAll(framework, '{{ js_script }}', js_scripts_embed)
                                    if(!res.headersSent){
                                        res.send(framework)
                                    }
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

function generateAuthKey(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }

module.exports = {
    database,
    update_database: function(newdatabase){
        database = newdatabase
    },
    replaceAll,
    generateAuthKey
}