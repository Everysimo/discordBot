const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
const ytdl = require('ytdl-core');
const lingua =require(config.lingua);

//quando il nuovo cliente è pronto esegue log
client.once('ready', () => {
	console.log('Ready!');
});

//prefisso comandi non musica !
const pnm=config.prefissoNonMusica;
//prefisso comandi musica $
const pm=config.prefissoMusica;

//login nel server tramite token
client.login(process.env.tokenBotDiscord);

//funzioni per commandi
async function play(message, serverQueue){
	const args = message.content.split(" ");			//input argomento 
	const voiceChannel = message.member.voice.channel;	//connessione al canale vocale
  	if (!voiceChannel){									//se l'utente non è in un canale genera eccezione
		return message.reply(lingua.voiceChannelNotFound);
	}

	const permissions = voiceChannel.permissionsFor(message.client.user);	//verifica permessi utente che richiama il messggio
  	if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    	return message.reply(lingua.voiceChannelNotPermission);
	}

	const songInfo = await ytdl.getInfo(args[1]);			//ottiene informazioni della canzone passata come argomento
	const song = {
    	title: songInfo.videoDetails.title,
    	url: songInfo.videoDetails.video_url,
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
			var connection = await voiceChannel.join();	//connessione al canale vocale dell'utente che invia il messagio
			queueContruct.connection = connection;			
			start(message.guild, queueContruct.songs[0]);	//starata la prima canzone in coda
		} catch (err) {
			console.log(err);
			queue.delete(message.guild.id);
			return message.reply(lingua.errorJoinVoiceChannel);
		}
	}
	else{	//se la coda delle canzoni non è vuota aggiunge la canzone alla coda

		serverQueue.songs.push(song);
		return message.reply(song.title +" "+ lingua.songAddQueue)
	}
}

//starta la canzona
function start(guild, song) {
	const serverQueue = queue.get(guild.id);
	if (!song) {
	  serverQueue.voiceChannel.leave();
	  queue.delete(guild.id);
	  return;
	}
	const dispatcher = serverQueue.connection.play(ytdl(song.url)).on("finish", () => {
        serverQueue.songs.shift();
        start(guild, serverQueue.songs[0]);
    }).on("error", error => console.error(error));
	dispatcher.setVolume(serverQueue.volume / 100);
	serverQueue.textChannel.send(lingua.startPlay+" "+song.title);
}

//skippa la canzone
function skip(message, serverQueue) {
	if (!message.member.voice.channel)
		return message.reply(lingua.voiceChannelNotFound);
	if (!serverQueue)
		return message.reply(lingua.notSong);
	serverQueue.connection.dispatcher.end();
}

//stoppa la riproduzione di canzoni
function stop(message, serverQueue) {
	if (!message.member.voice.channel)
	  	return message.reply(lingua.voiceChannelNotFound);
	if (!serverQueue)
		return message.reply(lingua.notSong);
	serverQueue.songs = [];
	serverQueue.connection.dispatcher.end();
}

//genera una slot 
function slot(message){
	const slotList=new Array();
	for (let index = 0; index < config.slotItem.length; index++) {
		slotList.push(Math.floor(Math.random() * config.slotItem.length));
	}
	const elementoIniziale=slotList[0];
	var vinto=true;
	slotList.forEach(element => {
		if (!(elementoIniziale===element)) {
			vinto=false;
		}
	});
	const risultato = new Discord.MessageEmbed()
	risultato.setTitle('Slot Machine');
	for (let index = 0; index < slotList.length; index++) {
		risultato.addFields(
			{ name: 'Slot '+index, value: config.slotItem[slotList[index]] , inline: true },
		);
	}
	if (vinto) {
		risultato.addFields(
			{ name: lingua.win, value: 'x coin' },
		);
		risultato.setColor("#00ff37");
	}else{
		risultato.addFields(
			{ name: lingua.lose, value: 'x coin' },
		);
		risultato.setColor("#f50505");
	}
	message.channel.send(risultato);
}

function coinflip(message){
	const m=message.content.split(" ")[1];
	var testa;
	var win;
	const risultato = new Discord.MessageEmbed();
	risultato.setTitle('coin flip');
	switch (Math.floor(Math.random() * 2)) {
		case 0:
			testa=true;
			risultato.setImage("https://upload.wikimedia.org/wikipedia/it/d/de/1_%E2%82%AC_Italia.jpg");
			break;
		case 1:
			testa=false;
			risultato.setImage("https://upload.wikimedia.org/wikipedia/it/0/06/1_%E2%82%AC_2007.jpg");
			break;
	}
	if(m==="testa"){
		if (testa) {
			win=true;
		}else{
			win=false;
		}
	}else if(m==="croce"){
		if (testa) {
			win=false;
		}else{
			win=true;
		}
	}else{
		message.reply(lingua.notSelect);
		return;
	}
	if (win) {
		risultato.addFields(
			{ name: lingua.win, value: 'x coin' },
		);
		risultato.setColor("#00ff37");
	}else{
		risultato.addFields(
			{ name: lingua.lose, value: 'x coin' },
		);
		risultato.setColor("#f50505");
	}
	message.channel.send(risultato);
}

//il bot join nel canale vocale del mittente del messaggio
async function join(message){
	const voiceChannel = message.member.voice.channel;	//memorizza il canale vocale del mittente del messaggio
	if (!voiceChannel){
		return message.reply(lingua.voiceChannelNotFound);
	}
	else{
		const permissions = voiceChannel.permissionsFor(message.client.user);	//verifica permessi utente che richiama il messggio
  		if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    		return message.reply(lingua.voiceChannelNotPermission);
		}
		else{
			try{
				await voiceChannel.join();
			}
			catch(err){
				console.log(err);
				return message.reply(lingua.errorJoinVoiceChannel);
			}
		}
	}
}

//aumentare volume di n della canzone in riproduzione
function volumeUp(message,serverQueue){
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
function volumeDown(message,serverQueue){
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
function setvolume(message,serverQueue){
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

//mappa che collega il commando a una funzione
let comandiMusicali =new Map();
comandiMusicali.set("play",play);
comandiMusicali.set("skip",skip);
comandiMusicali.set("stop",stop);
comandiMusicali.set("volumeup",volumeUp);
comandiMusicali.set("volumedown",volumeDown);
comandiMusicali.set("setvolume",setvolume);

//mappa comandi non musicali
let comandi =new Map();
comandi.set("slot",slot);
comandi.set("coinflip",coinflip);
comandi.set("join",join);

//coda di riproduzione
const queue = new Map();

//gestore ricezione messaggi
client.on("message", message => {
	//se l'autore del messaggio è un bot ignora
	if (message.author.bot) {
		return;

	}// se non è bot e il messaggio inizia con "!"
	else if (message.content.startsWith(pnm)) {
		//salva il contenuto del messaggio corrispondente al comando
		const com=message.content.split(" ")[0].substr(1);

		//se il comando è nella mappa dei comandi
		if (comandi.has(com)) {
			//esegue il comando specificato
			comandi.get(com)(message);
		}
		//se il comando non è nella mappa dei messaggi
		else{
			message.reply(lingua.commandNotFound);
		}
	}
	// se non è bot e il messaggio inizia con "$"
	else if (message.content.startsWith(pm)){
		//ottiene l'attuale coda delle canzoni
		const serverQueue = queue.get(message.guild.id);
		//salva il contenuto del messaggio corrispondente al comando
		const com=message.content.split(" ")[0].substr(1);

		//se il comando è nella mappa dei comandi musicali
		if (comandiMusicali.has(com)) {
			//esegue il comando specificato
			comandiMusicali.get(com)(message,serverQueue);
		}else{
			//risponde che il comando non esiste
			message.reply(lingua.comandNotFound);
		}
	}
});