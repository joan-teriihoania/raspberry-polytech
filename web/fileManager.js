const { fstat } = require("fs")
const fs = require('fs')

module.exports = {
    readFiles: function(files, callback){
        return new Promise(function (resolve, reject) {
            let filesContents = []
            const promises = files.map(file => { // get back an array of promises
              return new Promise(function(resolve, reject){
                fs.readFile(file, function(err, data) {
                  if(!err){
                    filesContents[file] = data.toString()
                    resolve()
                  } else {
                    reject(err)
                  }
                })
              })
            });
            Promise.all(promises)
              .then(() => { // all done!
                callback(filesContents)
              })
              .catch((error) => {
                reject(error)
              })
          })
    }
}