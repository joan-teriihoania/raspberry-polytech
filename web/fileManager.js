const { fstat } = require("fs")
const fs = require('fs')

module.exports = {
    readFiles: function(files, callback){
        return new Promise(function (resolve, reject) {
            let filesContents = []
            const promises = files.map(file => { // get back an array of promises
              return new Promise(function(resolve, reject){
                fs.stat(file, function(err, stats){
                  if(stats.isFile()){
                    fs.readFile(file, function(err, data) {
                      if(!err){
                        filesContents[file] = data.toString()
                        resolve()
                      } else {
                        reject(err)
                      }
                    })
                  } else {
                    resolve()
                  }
                })
              })
            });
            
            Promise.all(promises)
              .then(() => { // all done!
                callback(filesContents)
                resolve()
              })
              .catch((error) => {
                reject(error)
              })
          })
    }
}