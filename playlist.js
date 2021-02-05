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
                try{
                    songInfo = ytdl.getInfo(element.Song).then(()=>{
                        var song = {
                            title: songInfo.videoDetails.title,
                            url: songInfo.videoDetails.video_url,
                            isLive: songInfo.videoDetails.isLiveContent,
                            username: message.member.user.username,
                        };
                        stampa.addField(song.title,song.url,true);
                    })		//ottiene informazioni della canzone passata come argomento
                }
                catch(err){
                    throw new Error("errore nel caricamento dell informazioni della canzone");
                }
            });
            message.channel.send(stampa);
        });
    }
}


