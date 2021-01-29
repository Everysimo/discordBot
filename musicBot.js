const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
const ytdl = require('ytdl-core');

client.once('ready', () => {
	console.log('Ready!');
});

var p=config.prefisso;

client.login(process.env.tokenBotDiscord);

client.on('message', message => {
	if (message.content===p+'play') {
		message.member.voice.channel.join().then(connection=>{
			const stream = ytdl('https://www.youtube.com/watch?v=3ekFx8OXxtM',{filter:'audioonly'});
			const dispatcher = connection.play(stream);
			dispatcher.on('finish', () => message.member.voice.channel.leave());		
		});
		message.channel.send('https://www.youtube.com/watch?v=3ekFx8OXxtM');
	}
	var args=message.content.split(' ');
	if(args[0]===p+'play'){
		message.member.voice.channel.join().then(connection=>{
			const stream = ytdl(args[1],{filter:'audioonly'});
			const dispatcher = connection.play(stream);
			dispatcher.on('finish', () => message.member.voice.channel.leave());
		});
		message.channel.send(args[1]);
	}
});

