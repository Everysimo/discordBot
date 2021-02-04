const Discord = require('discord.js');
const config = require('./config.json');
const lingua =require(config.lingua);
const db=require("./dbOpertion.js");

exports.createPlaylist = function (message) {
    if(!message.member.user.bot){
        const nomePl=message.content.split(" ")[1];
        const id=message.member.user.id;
        
        db.createPlayListDB(id, nomePl);
    }
}

exports.addSongToPL = function (message) {
    if(!message.member.user.bot){
        const nomePl=message.content.split(" ")[1];
        const songUrl=message.content.split(" ")[2];
        const id=message.member.user.id;
        
        db.addSong(id,songUrl,nomePl);
    }
}

exports.removeSongFromPL = function (message) {
    if(!message.member.user.bot){
        const nomePl=message.content.split(" ")[1];
        const songUrl=message.content.split(" ")[2];
        const id=message.member.user.id;
        db.removeSongFromPlBD(id,songUrl,nomePl)
    }
}

exports.printPL = function (message) {
    if(!message.member.user.bot){
        const nomePl=message.content.split(" ")[1];
    	const id=message.member.user.id;
    }
}
