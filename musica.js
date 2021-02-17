const Discord = require('discord.js');
const config = require('./config.json');
const ytdl = require('ytdl-core');
const language =require('./language/'+config.language+'/musica.json');
const ytsr=require('ytsr');
const command=require("./command.json")
const radio=require("./radio.json")
const spdl = require('spdl-core');
spdl.setCredentials(process.env.spotifyClientID, process.env.spotifySecretID);
//coda di riproduzione
const queue = new Map();
exports.queue = queue;

async function play (message){
	var serverQueue = queue.get(message.guild.id);
	var args = message.content.split(" ")[1];	//input argomento 
	var songInfo;
	var song;
	if (!spdl.validateURL(args)){
		if(!ytdl.validateURL(args)){
			var element;
			for (let index = 1; index < message.content.split(" ").length; index++) {
				element=element+ " " + message.content.split(" ")[index];
			}
			var titolo=await ytsr(element,{limit:1});
			args=titolo.items.shift();
			if (!args) {
				message.reply(language.msgNoResultFound);
				return;
			}
			args=args.url;
		}
		try{
			songInfo = await ytdl.getInfo(args);			//ottiene informazioni della canzone passata come argomento
		}
		catch(err){
			throw new Error(language.errorLoadingSongInfo);
		}
		
		song = {
			title: songInfo.videoDetails.title,
			url: songInfo.videoDetails.video_url,
			isLive: songInfo.videoDetails.isLiveContent,
			username: message.member.user.username,
			where: "youtube"
		};	
	}else{
		try{
			songInfo=await spdl.getInfo(args);
		}
		catch(err){
			throw new Error(language.errorLoadingSongInfo);
		}
		song = {
			title: "titolo: "+songInfo.title+" di: "+songInfo.artist,
			url: songInfo.url,
			username: message.member.user.username,
			where: "spotify"
		};
	}
		
	const voiceChannel = message.member.voice.channel;	//connessione al canale vocale
  	if (!voiceChannel){									//se l'utente non è in un canale genera eccezione
		return message.reply(language.voiceChannelNotFound);
	}

	const permissions = voiceChannel.permissionsFor(message.client.user);	//verifica permessi utente che richiama il messggio
  	if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    	return message.reply(language.voiceChannelNotPermission);
	}

	if (!serverQueue) {					//se la coda delle canzoni è vuota
		const queueContruct = {
			textChannel: message.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 10,
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
			return message.reply(language.errorJoinVoiceChannel);
		}
	}
	else{	//se la coda delle canzoni non è vuota aggiunge la canzone alla coda

		serverQueue.songs.push(song);

		const messaggioAggiuntaCoda = new Discord.MessageEmbed();
		messaggioAggiuntaCoda.setTitle(language.songAddQueue);
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
	if (song.where==="spotify") {
		var dispatcher = serverQueue.connection.play((await spdl(song.url))).on("finish", () => {
			serverQueue.songs.shift();
			start(guild, serverQueue.songs[0]);
		}).on("error", error => console.error(error.stack));
	}else if (song.where==="youtube"){
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
	}
	
	dispatcher.setVolume(serverQueue.volume / 100);

	const messaggioRiproduzione = new Discord.MessageEmbed();
	messaggioRiproduzione.setTitle(language.startPlay);
	messaggioRiproduzione.setDescription("[ @"+song.username+" ]");
	messaggioRiproduzione.addFields({
		name: song.title,value:" "+song.url}
		);

	return serverQueue.textChannel.send(messaggioRiproduzione);
}

exports.showQueue= function(message){
	var serverQueue = queue.get(message.guild.id);
	if(!serverQueue){
		message.reply("Non ci sono canzoni in coda");
	}
	else{
		
		for (let index = 0; index < serverQueue.songs.length; index++) {
			const element = serverQueue.songs[index];
			const messageQueue = new Discord.MessageEmbed();
			messageQueue.setTitle(language.songInQueue);
			messageQueue.setDescription("[ @"+element.username+" ]");
			messageQueue.addFields({
				name: element.title,value: element.url}
			);
			message.channel.send(messageQueue);
		}
		

	}
}

//skippa la canzone
exports.skip = function (message) {
	var serverQueue = queue.get(message.guild.id);
	if (!message.member.voice.channel)
		return message.reply(language.voiceChannelNotFound);
	if (!serverQueue)
		return message.reply(language.notSong);
	serverQueue.connection.dispatcher.end();
}

//stoppa la riproduzione di canzoni
exports.stop = function (message) {
	var serverQueue = queue.get(message.guild.id);
	if (!message.member.voice.channel)
	  	return message.reply(language.voiceChannelNotFound);
	if (!serverQueue)
		return message.reply(language.notSong);
	serverQueue.songs = [];
	serverQueue.connection.dispatcher.end();
}
//settare volume di n della canzone in riproduzione
exports.setvolume = function (message){
	var serverQueue = queue.get(message.guild.id);
	const q = message.content.split(" ")[1];
	if (!message.member.voice.channel)
		return message.reply(language.voiceChannelNotFound);
	if (!serverQueue)
		return message.reply(language.notSong);
	var volume=parseInt(q);
	if(volume>100){
		volume=100;
	}
	if (isNaN(volume)) {
		volume = serverQueue.volume;
	}else{
		serverQueue.volume=volume;
	}
	serverQueue.connection.dispatcher.setVolume(serverQueue.volume / 100);
	message.channel.send(language.msgVolumeSetted+volume);
}

//show le radio disponibili
exports.showRadio = function (message){
	const resultRadioList = new Discord.MessageEmbed();

	resultRadioList.setTitle('\uD83D\uDCFB Radio \uD83D\uDCFB');
	for (let index = 0; index < radio.radio.length; index++) {
		const element = radio.radio[index];
		resultRadioList.addFields(
			{ name: config.prefixCommand+command.radio+' '+index, value: element.name, inline:true}
		);
	}

	message.channel.send(resultRadioList);
}

//riproduce la radio selezionata
exports.playRadio = function playRadio(message){
	const q = message.content.split(" ")[1];
	const radioNumber = parseInt(q);
	const resultErrorPlayRadio = new Discord.MessageEmbed();
	if (!isNaN(radioNumber)&&q<radio.radio.length) {
		message.content="play "+radio.radio[q].researche;
		play(message);
	}else{
		resultErrorPlayRadio.setTitle(language.radioNotFound);
		resultErrorPlayRadio.addFields(
			{ name: language.radio+radioNumber+language.notExists,inline:true},
		);
		message.reply(resultErrorPlayRadio);
	}
}
