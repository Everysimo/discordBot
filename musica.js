const Discord = require('discord.js');
const config = require('./config.json');
const ytdl = require('ytdl-core');
const lingua =require(config.lingua);

//coda di riproduzione
const queue = new Map();
exports.queue = queue;

exports.play= async function (message, serverQueue){
	const args = message.content.split(" ");			//input argomento 
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
		songInfo = await ytdl.getInfo(args[1]);			//ottiene informazioni della canzone passata come argomento
	}
	catch(err){
		throw new Error("errore nel caricamento dell informazioni della canzone");
	}
	
	var song = {
    	title: songInfo.videoDetails.title,
		url: songInfo.videoDetails.video_url,
		isLive: songInfo.videoDetails.isLiveContent
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
		queue.set(message.guild.id, queueContruct);
		queueContruct.songs.push(song);
		try {
			var connection = await voiceChannel.join();	//connessione al canale vocale dell'utente che invia il messaggio
			queueContruct.connection = connection;			
			start(message.guild, queueContruct.songs[0],message.member.user.username);	//starata la prima canzone in coda
		} catch (err) {
			console.log(err.stack);
			queue.delete(message.guild.id);
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
//starta la canzona
function start(guild, song, username) {
	var serverQueue = queue.get(guild.id);
	if (!song) {
	  serverQueue.voiceChannel.leave();
	  queue.delete(guild.id);
	  return;
	}
	if (song.isLive) {
		var dispatcher = serverQueue.connection.play(ytdl(song.url)).on("finish", () => {
			serverQueue.songs.shift();
			start(guild, serverQueue.songs[0]);
		}).on("error", error => console.error(error.stack));
	}else{
		var dispatcher = serverQueue.connection.play(ytdl(song.url,{filter: "audioonly"})).on("finish", () => {
			serverQueue.songs.shift();
			start(guild, serverQueue.songs[0]);
		}).on("error", error => console.error(error.stack));
	}
	dispatcher.setVolume(serverQueue.volume / 100);

	const messaggioRiproduzione = new Discord.MessageEmbed();
	messaggioRiproduzione.setTitle(lingua.startPlay);
	messaggioRiproduzione.setDescription("[ @"+username+" ]");
	messaggioRiproduzione.addFields({
		name: song.title,value:" "+song.url}
		);

	return serverQueue.textChannel.send(messaggioRiproduzione);
	//serverQueue.textChannel.send(lingua.startPlay+" "+song.title);
}

//skippa la canzone
exports.skip = function (message, serverQueue) {
	if (!message.member.voice.channel)
		return message.reply(lingua.voiceChannelNotFound);
	if (!serverQueue)
		return message.reply(lingua.notSong);
	serverQueue.connection.dispatcher.end();
}

//stoppa la riproduzione di canzoni
exports.stop = function (message, serverQueue) {
	if (!message.member.voice.channel)
	  	return message.reply(lingua.voiceChannelNotFound);
	if (!serverQueue)
		return message.reply(lingua.notSong);
	serverQueue.songs = [];
	serverQueue.connection.dispatcher.end();
}
//aumentare volume di n della canzone in riproduzione
exports.volumeUp = function (message,serverQueue){
	const q = message.content.split(" ")[1];
	if (!message.member.voice.channel)
		return message.reply(lingua.voiceChannelNotFound);
	if (!serverQueue)
		return message.reply(lingua.notSong);
		var volume=parseInt(q);
	if (isNaN(volume)) {
		volume = 1;
	}else{
		serverQueue.volume=serverQueue.volume+volume;
	}
	serverQueue.connection.dispatcher.setVolume(serverQueue.volume / 100);
	message.channel.send("volume alzato di "+volume);
}

//abbassare volume di n della canzone in riproduzione
exports.volumeDown = function (message,serverQueue){
	const q = message.content.split(" ")[1];
	if (!message.member.voice.channel)
		return message.reply(lingua.voiceChannelNotFound);
	if (!serverQueue)
		return message.reply(lingua.notSong);
	var volume=parseInt(q);
	if (isNaN(volume)) {
		volume = 1;
	}else{
		serverQueue.volume=serverQueue.volume-volume;
	}
	serverQueue.connection.dispatcher.setVolume(serverQueue.volume / 100);
	message.channel.send("volume abbassato di "+volume);
}
//settare volume di n della canzone in riproduzione
exports.setvolume = function (message,serverQueue){
	const q = message.content.split(" ")[1];
	if (!message.member.voice.channel)
		return message.reply(lingua.voiceChannelNotFound);
	if (!serverQueue)
		return message.reply(lingua.notSong);
	var volume=parseInt(q);
	if (isNaN(volume)) {
		volume = serverQueue.volume;
	}else{
		serverQueue.volume=volume;
	}
	serverQueue.connection.dispatcher.setVolume(serverQueue.volume / 100);
	message.channel.send("volume settato a "+volume);
}
