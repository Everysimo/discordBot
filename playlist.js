const Discord = require('discord.js');
const config = require('./config.json');
const lingua =require(config.lingua);
const db=require("./dbOpertion.js");
const ytdl = require('ytdl-core');

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
        db.leggiPL(id, nomePl,result= (risult)=>{
            const stampa= new Discord.MessageEmbed();
            stampa.setTitle("Playlist: "+nomePl);          
            risult.forEach(element => {
                ytdl.getInfo(element.song).then(songInfo=>{
                    var song = {
                        title: songInfo.videoDetails.title,
                        url: songInfo.videoDetails.video_url,
                    };
                    stampa.addFields({ name: song.title, value: song.url, inline:true},);
                })		//ottiene informazioni della canzone passata come argomento
            });
            message.channel.send(stampa);
        });
    }
}


