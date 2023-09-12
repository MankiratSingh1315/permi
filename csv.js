const fs = require('fs');
const firstline = require('firstline');

var file = 'entryDone.csv';

  
 async function saveCsv(csvString){
    var lines = csvString.split(/\r?\n/);
    try{
      var old = await firstline(file);
    }catch(ex){
      old = "old";
    }
    
    if(old == lines[0]){
      console.log("FOUND LINE");
        csvString = "\n"+lines[1];
    }

    fs.appendFile(file, csvString, err => {
      if (err) {
        console.error(err);
      }
    });
  }



  module.exports = {saveCsv}