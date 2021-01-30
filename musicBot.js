const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
const ytdl = require('ytdl-core');

client.once('ready', () => {
	console.log('Ready!');
});

var p=config.prefisso;
var ry=config.reactionYes;
var rn=config.reactionNot;

client.on('message', message => {
	//commandi senza argomenti aggiuntivi
	if (message.content===p+'play') {
		if (message.member.voice.channel==null) {
			message.react(rn);
		}else{
			message.member.voice.channel.join().then(connection=>{
				const stream = ytdl('https://www.youtube.com/watch?v=3ekFx8OXxtM',{filter:'videoandaudio'});
				const dispatcher = connection.play(stream);
				dispatcher.on('finish', () => message.member.voice.channel.leave());		
			});
			message.react(ry);
		}
		return;
	}
	if(message.content===p+'join'){
		if (message.member.voice.channel==null) {
			message.react(rn);
		}else{
			message.member.voice.channel.join();
			message.react(ry);
		}
		return;
	}
	//commandi con argomenti aggiuntivi
	var args=message.content.split(' ');
	if(args[0]===p+'play'){
		if (message.member.voice.channel==null) {
			message.react(rn);
		}else{
			message.member.voice.channel.join().then(connection=>{
				const stream = ytdl(args[1],{filter:'audioonly'});
				const dispatcher = connection.play(stream);
				dispatcher.on('finish', () => message.member.voice.channel.leave());
			});
			message.react(ry);
		}
		return;
	}
});

client.login(process.env.tokenBotDiscord);