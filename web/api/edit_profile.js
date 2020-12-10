const fs = require('fs')
const formidable = require('formidable')
const { database } = require('../server')
const db = require('../db')
const { encrypt } = require('../crypto')


module.exports = {
    exec: function(req, res){
        var errors = []
        var response = {}

        var mv_file = function (oldpath, newpath, filename, callback){
            fs.copyFile(oldpath, newpath, function(err){
                if (err) {
                    console.log(err)
                    errors.push("Erreur (" + err.code + "-1) : Une erreur technique s'est produite.")
                } else {
                    db.run(database, "UPDATE users SET img_profile = '/assets/img/avatars/"+filename+"' WHERE user_id = " + res.user.user_id)
                    response["img_profile"] = "/assets/img/avatars/" + filename;
                }
                callback()
            })
        }

        var load_file = function(formData, callback){
            var oldpath = formData.img_profile.path;
            var extension = formData.img_profile.name.split('.')[formData.img_profile.name.split('.').length-1].toLowerCase()
            var filename = res.user.user_id + "." + extension
            var newpath = './public/assets/img/avatars/' + filename;

            if(!['jpg', "jpeg", "png", "svg", "gif"].includes(extension)){
                errors.push("Extension de fichier <b>"+extension+"</b> inconnue (jpg, jpeg, png, svg, gif)")
                callback()
                return
            }
            
            fs.stat(newpath, function(err, stats){
                if (err) {
                    if(err.code == "ENOENT"){
                        mv_file(oldpath, newpath, filename, callback)
                    } else {
                        console.log(err)
                        errors.push("Erreur (" + err.code + "-2) : Une erreur technique s'est produite.")
                        callback()
                    }
                } else {
                    if(stats.isFile()){
                        fs.unlink(newpath, function(err){
                            if (err) {
                                console.log(err)
                                errors.push("Erreur (" + err.code + "-3) : Une erreur technique s'est produite.")
                                callback()
                            } else {
                                mv_file(oldpath, newpath, filename, callback)
                            }
                        })
                    } else {
                        callback()
                    }
                }
            })
        }

        var form = new formidable.IncomingForm();
        var uneditableFields = ["password", "user_id", "level"]
        var fieldRequire = {
            "username": {
                "regex": /[`!@#$%^&*()+\=\[\]{};':"\\|,<>\/?~]/,
                "nullable": false,
                "type": "string"
            },
            "email": {
                "regex": /[ `!#$%^&*()+\\=\[\]{};':"\\|,<>\/?~]/,
                "nullable": true,
                "type": "string"
            }
        }

        form.parse(req, function (err, fields, formData) {
            var img_profile = false
            var updatePromises = []

            for(var field in fields){
                if(!(field in uneditableFields)){
                    if(!fieldRequire[field]['nullable'] && (fields[field].replace(/ /gi, "") == "" || fields[field] == undefined)){
                        errors.push("Le champ '"+field+"' doit être obligatoirement remplis")
                        break
                    }

                    if(fieldRequire[field]['regex'].test(fields[field])){
                        errors.push("Le champ '"+field+"' contient des caractères interdits.")
                        break
                    }
                    
                    if(typeof(fields[field]) != fieldRequire[field]['type']){
                        errors.push("Le champ '"+field+"' n'est pas de type '"+fieldRequire[field]['type']+"'")
                        break
                    }

                    if(field == 'email'){res.cookie("JZ-Translation-auth0", encrypt(fields[field]))}
                    updatePromises.push(db.run(database, "UPDATE users SET "+field+" = '"+fields[field]+"' WHERE user_id = " + res.user.user_id))
                    response[field] = fields[field]
                }
            }

            if(formData['img_profile'] != undefined){
                img_profile = true
            }

            Promise.all(updatePromises).then(function(){
                if(img_profile){
                    load_file(formData, function(){
                        if(errors.length > 0){
                            res.status(500)
                            res.send(errors[0])
                        } else {
                            res.status(200)
                            res.send(response)
                        }
                    })
                } else {
                    if(errors.length > 0){
                        res.status(500)
                        res.send(errors[0])
                    } else {
                        res.status(200)
                        res.send(response)
                    }
                }
            }).catch(function(){
                res.status(401)
                res.send(errors[0])
            })
        })
    }
}