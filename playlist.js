const Discord = require('discord.js');
const config = require('./config.json');
const lingua =require(config.lingua);
const db=require("./dbOpertion.js");

exports.createPlaylist = function (message) {
    if(!message.member.user.bot){
        const nomePl=message.content.split(" ")[1];
        const id=message.member.user.id;
        try {
            db.cretePlayListDB(id, nomePl);
        } catch (error) {
            message.reply("playlist gia presente")
        }
    }
}

exports.addSongToPL = function (message) {
    if(!message.member.user.bot){
        const nomePl=message.content.split(" ")[1];
        const songUrl=message.content.split(" ")[2];
        const id=message.member.user.id;
        try {
            db.addSong(id,songUrl,nomePl)
        } catch (error) {
            message.reply("canzone gia presente nella playlist")
        }
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
