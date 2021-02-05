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
            for (const element of risult) {
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
                stampa.addField(song.title,song.url,true);
            }
            message.channel.send(stampa);
        });
    }
}

exports.playPL= function (message, serverQueue) {
    const nomePl=message.content.split(" ")[1];
    const id=message.member.user.id;
    db.leggiPL(id, nomePl,async function(risult){
        if (risult) {
            await play(message,risult[0].song,serverQueue).then(async ()=>{
				await sleep(10000);
				for (let index = 1; index < risult.length; index++) {
					console.log("Ho iniziato il ciclo");
					const element = risult[index];
	
						console.log("aggiungo la canzone in coda");
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
						serverQueue.songs.push(song);
						const messaggioAggiuntaCoda = new Discord.MessageEmbed();
						messaggioAggiuntaCoda.setTitle(lingua.songAddQueue);
						messaggioAggiuntaCoda.setDescription("[ @"+message.member.user.username+" ]");
						messaggioAggiuntaCoda.addFields({
						name: song.title,value:" "+song.url}
						);
						message.reply(messaggioAggiuntaCoda);
				}
				return
			});
		}
    });
}

play = async function (message, songUrl,serverQueue){
	const voiceChannel = message.member.voice.channel;	//connessione al canale vocale
  	if (!voiceChannel){									//se l'utente non è in un canale genera eccezione
		return message.reply(lingua.voiceChannelNotFound);
	}

	const permissions = voiceChannel.permissionsFor(message.client.user);	//verifica permessi utente che richiama il messggio
  	if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    	return message.reply(lingua.voiceChannelNotPermission);
	}
	var songInfo;

	try{
		songInfo = await ytdl.getInfo(songUrl);			//ottiene informazioni della canzone passata come argomento
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

	if (!serverQueue) {					//se la coda delle canzoni è vuota
		const queueContruct = {
			textChannel: message.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 50,
			playing: true,
		};
		musica.queue.set(message.guild.id, queueContruct);
		queueContruct.songs.push(song);
		try {
			var connection = await voiceChannel.join();	//connessione al canale vocale dell'utente che invia il messaggio
			queueContruct.connection = connection;			
			this.start(message.guild, queueContruct.songs[0]);	//starata la prima canzone in coda
		} catch (err) {
			console.log(err.stack);
			musica.queue.delete(message.guild.id);
			return message.reply(lingua.errorJoinVoiceChannel);
		}
	}
	else{	//se la coda delle canzoni non è vuota aggiunge la canzone alla coda

		serverQueue.songs.push(song);

		const messaggioAggiuntaCoda = new Discord.MessageEmbed();
		messaggioAggiuntaCoda.setTitle(lingua.songAddQueue);
		messaggioAggiuntaCoda.setDescription("[ @"+message.member.user.username+" ]");
		messaggioAggiuntaCoda.addFields({
		name: song.title,value:" "+song.url}
		);
		return message.reply(messaggioAggiuntaCoda);
		//return message.reply(song.title +" "+ lingua.songAddQueue)
	}
}

async function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}