const Discord = require('discord.js');
const config = require('./config.json');
const ytdl = require('ytdl-core');
const lingua =require(config.lingua);
const ytsr=require('ytsr');
//coda di riproduzione
const queue = new Map();
exports.queue = queue;

async function play (message){
	var serverQueue = queue.get(message.guild.id);
	var args = message.content.split(" ")[1];	//input argomento 
	if(!ytdl.validateURL(args)){
		var element;
		for (let index = 1; index < message.content.split(" ").length; index++) {
			element=element+ " " + message.content.split(" ")[index];
		}
		var titolo=await ytsr(element,{limit:1});
		args=titolo.items.shift();
		if (!args) {
			message.reply("nessun risultato trovato");
			return;
		}
		args=args.url;
	}			
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
		songInfo = await ytdl.getInfo(args);			//ottiene informazioni della canzone passata come argomento
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
		queue.set(message.guild.id, queueContruct);
		queueContruct.songs.push(song);
		try {
			var connection = await voiceChannel.join();	//connessione al canale vocale dell'utente che invia il messaggio
			queueContruct.connection = connection;			
			this.start(message.guild, queueContruct.songs[0]);	//starata la prima canzone in coda
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
	}
}
exports.play = play;

//starta la canzona
start = function (guild, song) {
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
	messaggioRiproduzione.setDescription("[ @"+song.username+" ]");
	messaggioRiproduzione.addFields({
		name: song.title,value:" "+song.url}
		);

	return serverQueue.textChannel.send(messaggioRiproduzione);
}

//skippa la canzone
exports.skip = function (message) {
	var serverQueue = queue.get(message.guild.id);
	if (!message.member.voice.channel)
		return message.reply(lingua.voiceChannelNotFound);
	if (!serverQueue)
		return message.reply(lingua.notSong);
	serverQueue.connection.dispatcher.end();
}

//stoppa la riproduzione di canzoni
exports.stop = function (message) {
	var serverQueue = queue.get(message.guild.id);
	if (!message.member.voice.channel)
	  	return message.reply(lingua.voiceChannelNotFound);
	if (!serverQueue)
		return message.reply(lingua.notSong);
	serverQueue.songs = [];
	serverQueue.connection.dispatcher.end();
}
//aumentare volume di n della canzone in riproduzione
exports.volumeUp = function (message){
	var serverQueue = queue.get(message.guild.id);
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
exports.volumeDown = function (message){
	var serverQueue = queue.get(message.guild.id);
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
exports.setvolume = function (message){
	var serverQueue = queue.get(message.guild.id);
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

//show le radio disponibili
exports.showRadio = function (message){
	const resultRadioList = new Discord.MessageEmbed();

	resultRadioList.setTitle('\uD83D\uDCFB Radio \uD83D\uDCFB');
	resultRadioList.addFields(
		{ name: '!radio 0', value: "nightcore Radio", inline:true},
		{ name: '!radio 1', value: "lo-fi Radio", inline:true},
		{ name: '!radio 2', value: "pop Radio", inline:true},
		{ name: '!radio 3', value: "rock Radio", inline:true},
		{ name: '!radio 4', value: "anime Radio", inline:true},
	);

	message.channel.send(resultRadioList);
}

//riproduce la radio selezionata
exports.playRadio = function playRadio(message){
	const q = message.content.split(" ")[1];
	const radioNumber = parseInt(q);
	var newMessage = message;
	const resultErrorPlayRadio = new Discord.MessageEmbed();
	
	switch (radioNumber){
		case 0:
			newMessage.edit("play nightcore radio 24/7");
			play(newMessage);
			break;
		case 1:
			newMessage.edit("play lo-fi radio 24/7");
			break;
		case 2:
			newMessage.edit("play pop radio 24/7");
			play(newMessage);
			break;
		case 3:
			newMessage.edit("play rock radio 24/7");
			play(newMessage);
			break;
		case 4:
			newMessage.edit("play anime radio 24/7");
			play(newMessage);
			break;
		default:
			resultErrorPlayRadio.setTitle("Radio non Trovata");
			resultErrorPlayRadio.addFields(
				{ name: 'la radio '+radioNumber+'non esiste',inline:true},
			);
			message.reply(resultErrorPlayRadio);
		break;
	}
}
