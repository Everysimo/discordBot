const langPackage = require("langpackage");
const fs = require("fs");

var langPack ={};
exports.langPack = langPack;

fs.readdir("./language",(err, data) => {
    if (err) {
        throw err;
    }
    for (let index = 0; index < data.length; index++) {
        const element = data[index];
        fs.readdir("./language/"+element,(err1, data1) => {
            if (err1) {
                throw err1;
            }
            for (let index = 0; index < data1.length; index++) {
                const element1 = data1[index];
                fs.readFile("./language/"+element+"/"+element1,(err2, data2) => {
                    if (err2) {
                        throw err2;
                    }
                    langPack[element]=new langPackage();
                    langPack[element].importJSON(data2.toString())
                });
            }
        });
    }
})