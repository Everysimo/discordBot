const Discord = require('discord.js');
const config = require('./config.json');
const lingua =require(config.lingua);
const db=require("./dbOpertion.js");
const ytdl = require('ytdl-core');
const musica=require("./musica.js")

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
        db.leggiPL(id, nomePl,async function(risult){
            const stampa= new Discord.MessageEmbed();
            stampa.setTitle("Playlist: "+nomePl);
			for (let index = 0; index < risult.length; index++) {
				const element = risult[index];
                var songInfo;
	            try{
		            songInfo = await ytdl.getInfo(element.song);			//ottiene informazioni della canzone passata come argomento
	            }
	            catch(err){
		            throw new Error("errore nel caricamento dell informazioni della canzone");
	            }
	            var song = {
    	            title: songInfo.videoDetails.title,
		            url: songInfo.videoDetails.video_url,
	            };		//ottiene informazioni della canzone passata come 
                stampa.addField(index+") "+song.title,song.url,true);
            }
            message.channel.send(stampa);
        });
    }
}

exports.playPL= function (message) {
    const nomePl=message.content.split(" ")[1];
	var nC=parseInt(message.content.split(" ")[2]);
	if (isNaN(nC)) {
		nC=0;
	}
    const id=message.member.user.id;
    db.leggiPL(id, nomePl,async function(risult){
        if (risult) {
			if (!musica.queue.has(message.guild.id)) {					//se la coda delle canzoni è vuota
				const queueContruct = {
					textChannel: message.channel,
					voiceChannel: message.member.voice.channel,
					connection: null,
					songs: [],
					volume: 50,
					playing: true,
				};
				musica.queue.set(message.guild.id, queueContruct);
			}
			for (let index = 0; index < risult.length&&index < nC; index++) {
				const element = risult.shift()
				risult.push(element);
			}
			for (let index = 0; index < risult.length; index++) {
				const element = risult[index];
				var songInfo;

				try{
					songInfo = await ytdl.getInfo(element.song);			//ottiene informazioni della canzone passata come argomento
				}
				catch(err){
					throw new Error("errore nel caricamento dell informazioni della canzone");
				}
				var song = {
    				title: songInfo.videoDetails.title,
					url: songInfo.videoDetails.video_url,
					isLive: songInfo.videoDetails.isLiveContent,
					username: message.member.user.username,
				};
				musica.queue.get(message.guild.id).songs.push(song);
				const messaggioAggiuntaCoda = new Discord.MessageEmbed();
				messaggioAggiuntaCoda.setTitle(lingua.songAddQueue);
				messaggioAggiuntaCoda.setDescription("[ @"+message.member.user.username+" ]");
				messaggioAggiuntaCoda.addFields({
					name: song.title,value:" "+song.url}
				);
				message.reply(messaggioAggiuntaCoda);
			}
		}
		try {
			var connection = await message.member.voice.channel.join();	//connessione al canale vocale dell'utente che invia il messaggio
			musica.queue.get(message.guild.id).connection = connection;			
			this.start(message.guild, musica.queue.get(message.guild.id).songs[0]);	//starata la prima canzone in coda
		} catch (err) {
			console.log(err.stack);
			musica.queue.delete(message.guild.id);
			message.reply(lingua.errorJoinVoiceChannel);
		}
    });
}

exports.buyPL=function (message){
	if(!message.member.user.bot){
		var nPl=parseInt(message.content.split(" ")[1]);
		const id=message.member.user.id;
		if (!isNaN(nPl)) {
			db.addnPL(nPl,id);
		}else{
			message.reply("importo non valito")
		}
	}
}