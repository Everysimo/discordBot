const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
const ytdl = require('ytdl-core');
const lingua =require(config.lingua);
const db=require("./dbOpertion");
const gameRoom=require("./gameRoom")

db.dbConnect();

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

<<<<<<< Updated upstream
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
=======
//genera una slot 
function slot(message){
	const id=message.member.user.id;
	db.saldoGiocatore(id,function(saldo){
		var importo=parseInt(message.content.split(" ")[1]);
		if (!isNaN(importo) && importo > 0) {
			if (verificaSaldo(importo,saldo)) {
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
					db.aggiornaSaldo(saldo+(importo*9),id);
					risultato.addFields(
						{ name: lingua.win, value: importo*9+' coin' },
					);
					risultato.setColor("#00ff37");
				}else{
					db.aggiornaSaldo(saldo-importo,id);
					risultato.addFields(
						{ name: lingua.lose, value: importo+' coin' },
					);
					risultato.setColor("#f50505");
				}
				message.channel.send(risultato);
			}else{
				message.reply("non hai abbastanza coin");
			}
		}else{
			message.reply("importo non valito");
		}
	});	
}

//lancio moneta testa o croce
function coinflip(message){
	const m=message.content.split(" ")[1];
	const id=message.member.user.id;
	db.saldoGiocatore(id,function(saldo){
		var importo=parseInt(message.content.split(" ")[2]);
		if (!isNaN(importo) && importo > 0) {
			if (verificaSaldo(importo,saldo)) {
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
				if(m==="testa"||m==="t"){
					if (testa) {
						win=true;
					}else{
						win=false;
					}
				}else if(m==="croce"||m==="c"){
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
					db.aggiornaSaldo(saldo+(importo*2),id);
					risultato.addFields(
						{ name: lingua.win, value: importo*2+' coin' },
					);
					risultato.setColor("#00ff37");
				}else{
					db.aggiornaSaldo(saldo-importo,id);
					risultato.addFields(
						{ name: lingua.lose, value: importo+' coin' },
					);
					risultato.setColor("#f50505");
				}
				message.channel.send(risultato);
			}else{
				message.reply("non hai abbastanza coin");
			}
		}else{
			message.reply("importo non valito");
		}
	});

>>>>>>> Stashed changes
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
				console.log(err.stack);
				return message.reply(lingua.errorJoinVoiceChannel);
			}
		}
	}
}

//stampa la lista dei comandi disponibili
function help(message){
	const risultato = new Discord.MessageEmbed();
	const risultatoComandiMusicali = new Discord.MessageEmbed();
	risultato.setTitle('HydraBot');
	risultato.setDescription('Comandi');
	risultato.addFields(
		{ name: '!coinflip X value', value: 'prova a vincere dei coin con un lancio di moneta X: (testa,t) (croce,c)', inline:true},
		{ name: '!help', value: 'lista dei comandi', inline:true},
		{ name: '!join', value: 'Il BOT entra nel tuo attuale canale vocale', inline:true},
		{ name: '!roulette X value', value: 'Giro di roulette, x= rosso/r x3, nero/n x3, numero x36, 0 x 50', inline:true},
		{ name: '!saldo', value: 'Restituisce il tuo saldo corrente', inline:true},
		{ name: '!signin', value: 'iscriviti al server per poter giocare', inline:true},
		{ name: '!slot value', value: 'prova a vincere dei coin alle slot', inline:true},
	);

	risultatoComandiMusicali.setTitle('Comandi Musicali');
	risultatoComandiMusicali.addFields(
		{ name: '$play', value: 'aggiungi una canzone alla coda di riproduzione e falla prartire se non c\'è nulla in coda',inline:true},
		{ name: '$setvolume x', value: 'setta volume a x (0-100 )', inline:true},
		{ name: '$skip', value: 'skip di una canzone dalla coda', inline:true},
		{ name: '$stop', value: 'interruzione della riproduzione ed eliminazione della coda di riproduzione', inline:true},
		{ name: '$volumedown x', value: 'abbassa il volume di x(0-100)', inline:true},
		{ name: '$volumeup x', value: 'alza il volume di x(0-100)', inline:true},
	);

	message.channel.send(risultato);
	message.channel.send(risultatoComandiMusicali);
}

function signIn(message){
	if(!message.member.user.bot){
		dbpool.getConnection((err, db) => {
			const nickname=message.member.user.username;
			const id=message.member.user.id;
			var sql= `INSERT INTO utente (idutente, nickname) VALUES ('${id}','${nickname}')`;
			
			db.query(sql, function (err) {
				db.release();
				if(err.code.match('ER_DUP_ENTRY')){

					const messaggioRifiuto = new Discord.MessageEmbed();
					messaggioRifiuto.setTitle("Furbacchione "+ nickname);
					messaggioRifiuto.addFields(
						{ name: 'Ti sei già iscritto una volta',
						 value: 'So che volevi un altro Bonus, ma per altri coin devi sudarteli', inline:true},
					)
					
					console.log("Utente già presente del database");
					message.channel.send(messaggioRifiuto);
					return
				}
				else{
					const messaggioConferma = new Discord.MessageEmbed();
					messaggioConferma.setTitle("Benvenuto "+ nickname);
					messaggioConferma.addFields(
						{ name: 'Sei diventato ufficialmente una testa dell\'Hydra',
						 value: 'Come Benvenuto ti regaliamo 1000 coin da poter spendere allo !shop o scommetterli, per maggiori info !comandi', inline:true},
					)

					console.log("Utente registrato correttamente");
					message.channel.send(messaggioConferma);
				}
			});
			
			if(err){
				console.log("Errore durante la connessione al DataBase",err);
				return
			}
		});
	}
}

function getSaldo(message){
	if(!message.member.user.bot){
		const id=message.member.user.id;
		db.saldoGiocatore(id,function(saldo){
			message.reply("saldo: "+saldo);
		});
	}
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
comandi.set("slot",gameRoom.slot());
comandi.set("signin",signIn);
comandi.set("coinflip",gameRoom.coinflip());
comandi.set("join",join);
comandi.set("help",help);
comandi.set("saldo",getSaldo);
comandi.set("roulette",gameRoom.roulette());

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
			message.reply(lingua.commandNotFound);
		}
	}
});

function verificaSaldo(importo,saldo){
	if(importo <= saldo){
		return true;
	}
	else{
		return false;
	}
}