  
/**
 * Shows how to use chaining rather than the `serialize` method.
 */
"use strict";

const fs = require('fs');
const sqlite3 = require('sqlite3');
const server = require('./server')

module.exports = {
    createDB: function() {        
        return new sqlite3.Database('database.sqlite3')
    },
    createTable: function(db, tablename, rows) {
        var templateRows = [{
            name: "",
            type: "",
            primary: false,
            not_null: false
        }]
    
        var rowsString = []
        for (var row of rows) {
            var rowString = row.name
            rowString += " " + row.type
            if(row.primary){
                rowString += " PRIMARY KEY"
            } else {
                if(row.not_null){
                    rowString += " NOT NULL"
                }
            }
            rowsString.push(rowString)
        }
    
        db.run("CREATE TABLE IF NOT EXISTS " + tablename + "(" + rowsString.join(", ") + ")");
    },
    insert: function(db, tablename, rows) {
        var templateRows = {
            "rowName": "rowContent"
        }

        var lastIDs = []
        
        return new Promise(function(resolve, reject){
            var promises = []
            for(var row of rows){
                var cols = []
                var values = []
                
                for (const [col, value] of Object.entries(row)) {
                    cols.push(col)
                    if(Number.isInteger(value)){
                        values.push(value)
                    } else {
                        values.push('"' + value + '"')
                    }
                }
                
                promises.push(
                    new Promise(function(resolve, reject){
                        db.run("INSERT INTO " + tablename + "("+cols.join(', ')+") VALUES ("+values.join(", ")+")", function(err){
                            if(err){
                                reject(err)
                            } else {
                                lastIDs.push(this.lastID)
                                resolve()
                            }
                        })
                    })
                )
            }

            Promise.all(promises).then(() => {
                resolve(lastIDs)
            }).catch(() => {
                reject()
            })
            
        })
    },
    run: function(db, request){
        return new Promise(function(resolve, reject){
            db.run(request, function(err){
                if(err){
                    console.log(err)
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    },
    selectAll: function(db, tablename, callback) {
        this.select(db, "SELECT * FROM " + tablename, callback)
    },
    select: function(db, request, callback) {
        db.all(request, function(err, rows){
            callback(rows)
        });
    },
    closeDB: function() {
        db.close();
    }
}