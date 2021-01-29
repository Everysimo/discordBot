const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');

client.once('ready', () => {
	console.log('Ready!');
});

var p=config.prefisso;

client.login(process.env.tokenBotDiscord);

client.on('message', message => {
	if (message.content===p+'play') {
		message.author.send('play');
	}
});

