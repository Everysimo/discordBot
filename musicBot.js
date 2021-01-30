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
client.login(process.env.tokenBotDiscord);

client.on('message', message => {
	if (message.content===p+'play') {
		if (message.member.voice.channel==null) {
			message.react(rn);
		}
		message.member.voice.channel.join().then(connection=>{
			const stream = ytdl('https://www.youtube.com/watch?v=3ekFx8OXxtM',{filter:'videoandaudio'});
			const dispatcher = connection.play(stream);
			dispatcher.on('finish', () => message.member.voice.channel.leave());		
		});
		message.react(ry);
	}
	var args=message.content.split(' ');
	if(args[0]===p+'play'){
		if (message.member.voice.channel==null) {
			message.react(rn);
		}
		message.member.voice.channel.join().then(connection=>{
			const stream = ytdl(args[1],{filter:'audioonly'});
			const dispatcher = connection.play(stream);
			dispatcher.on('finish', () => message.member.voice.channel.leave());
		});
		message.react(ry);
	}
	if(message.content===p+'join'){
		message.member.voice.channel.join();
	}
});

