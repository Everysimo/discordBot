const langPackage = require("langpackage");
var langPack ={};
exports.langPack = langPack;
langPack.en=new langPackage();
langPack.it=new langPackage();

langPack.en.pushPhrase('hello', 'hello word');
langPack.it.pushPhrase('hello', 'ciao mondo');

console.log(langPack['it'].get('hello'));
console.log(langPack['en'].get('hello'));