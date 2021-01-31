const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
const ytdl = require('ytdl-core');
const lingua =require(config.lingua);

client.once('ready', () => {
	console.log('Ready!');
});

var pnm=config.prefissoNonMusica;
var pm=config.prefissoMusica;
var ry=config.reactionYes;
var rn=config.reactionNot;

client.login(process.env.tokenBotDiscord);

//funzioni per commandi
async function play(message, serverQueue){
	const args = message.content.split(" ");
	const voiceChannel = message.member.voice.channel;
  	if (!voiceChannel){
		return message.reply(lingua.voiceChannelNotFound);
	}
	const permissions = voiceChannel.permissionsFor(message.client.user);
  	if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    	return message.reply(lingua.voiceChannelNotPermission);
	}
	const songInfo = await ytdl.getInfo(args[1]);
	const song = {
    	title: songInfo.videoDetails.title,
    	url: songInfo.videoDetails.video_url,
	};
	if (!serverQueue) {
		const queueContruct = {
			textChannel: message.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true,
		};
		queue.set(message.guild.id, queueContruct);
		queueContruct.songs.push(song);
		try {
			var connection = await voiceChannel.join();
			queueContruct.connection = connection;
			start(message.guild, queueContruct.songs[0]);
		} catch (err) {
			console.log(err);
			queue.delete(message.guild.id);
			return message.reply(lingua.errorJoinVoiceChannel);
		}
	}else {
		serverQueue.songs.push(song);
		return message.reply(song.title +" "+ lingua.songAddQueue)
	}
}
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
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
	serverQueue.textChannel.send(lingua.startPlay+" "+song.title);
}
function skip(message, serverQueue) {
	if (!message.member.voice.channel)
		return message.reply(lingua.voiceChannelNotFound);
	if (!serverQueue)
		return message.reply(lingua.notSong);
	serverQueue.connection.dispatcher.end();
}
function stop(message, serverQueue) {
	if (!message.member.voice.channel)
	  	return message.reply(lingua.voiceChannelNotFound);
	if (!serverQueue)
		return message.reply(lingua.notSong);
	serverQueue.songs = [];
	serverQueue.connection.dispatcher.end();
}
function ping(message){
	message.reply("pong");
}
function slot(message){
	var slotList=new Array();
	for (let index = 0; index < config.slotNumber; index++) {
		slotList.push(Math.floor(Math.random() * config.slotNumber));
	}
	var elementoIniziale=slotList[0];
	var vinto=true;
	slotList.forEach(element => {
		if (!(elementoIniziale===element)) {
			vinto=false;
		}
	});
	const risultato = new Discord.MessageEmbed()
	risultato.setTitle('Slot Machine')
	for (let index = 0; index < slotList.length; index++) {
		risultato.addFields(
			{ name: 'Slot '+index, value: config.slotItem[slotList[index]] , inline: true },
		);
	}
	if (vinto) {
		risultato.addFields(
			{ name: lingua.win, value: 'x coin' },
		);
		risultato.setColor("#00ff37")
	}else{
		risultato.addFields(
			{ name: lingua.lose, value: 'x coin' },
		);
		risultato.setColor("#f50505")
	}
	message.channel.send(risultato);
}
function moneta(message){
	const m=message.content.split(" ")[1];
	var testa;
	var win;
	const risultato = new Discord.MessageEmbed()
	risultato.setTitle('Moneta');
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


//mappa che collega il commando a una funzione
let commandiMusicali =new Map();
commandiMusicali.set("play",play);
commandiMusicali.set("skip",skip);
commandiMusicali.set("stop",stop);
let commandi =new Map();
commandi.set("ping",ping);
commandi.set("slot",slot);
comandi.set("moneta",moneta);

//coda di riproduzione
const queue = new Map();

client.on("message", message => {
	if (message.author.bot) {
		return;
	}else if (message.content.startsWith(pnm)) {
		const com=message.content.split(" ")[0].substr(1);
		if (commandi.has(com)) {
			commandi.get(com)(message);
		}else{
			message.reply(lingua.comandNotFound);
		}
	}else if (message.content.startsWith(pm)){
		const serverQueue = queue.get(message.guild.id);
		const com=message.content.split(" ")[0].substr(1);
		if (commandiMusicali.has(com)) {
			commandiMusicali.get(com)(message,serverQueue);
		}else{
			message.reply(lingua.comandNotFound);
		}
	}
});