const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
const ytdl = require('ytdl-core');
const lingua =require(config.lingua);
const mysql = require('mysql');

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

//creazione pool di connessione al DataBase
const dbpool = mysql.createPool({
	host: process.env.host,
	user: process.env.user,
	password: process.env.password,
	database: process.env.database,
	port: 3306,
});
global.dbpool = dbpool;

//ottenere connessione dall pool ed eseguire connessione
dbpool.getConnection(function(err){
	if (err) {
		console.log(err.stack);
		throw new Error("Errore durante la connessione al database");
	}
	console.log("Database connesso!");
});

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
			start(message.guild, queueContruct.songs[0]);	//starata la prima canzone in coda
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
		messaggioAggiuntaCoda.setDescription("[@"+message.user.name+"]");
		messaggioAggiuntaCoda.addFields({
		name: song.title,value:" "+song.url}
		);

		return message.reply(messaggioAggiuntaCoda);
		//return message.reply(song.title +" "+ lingua.songAddQueue)
	}
}

//starta la canzona
function start(guild, song) {
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
	messaggioRiproduzione.setDescription("[@"+guild.message.user.name+"]");
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
}

//genera una slot 
function slot(message){
	const id=message.member.user.id;
	saldoGiocatore(id,function(saldo){
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
					aggiornaSaldo(saldo+(importo*9),id);
					risultato.addFields(
						{ name: lingua.win, value: importo*9+' coin' },
					);
					risultato.setColor("#00ff37");
				}else{
					aggiornaSaldo(saldo-importo,id);
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
	saldoGiocatore(id,function(saldo){
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
					aggiornaSaldo(saldo+(importo*2),id);
					risultato.addFields(
						{ name: lingua.win, value: importo*2+' coin' },
					);
					risultato.setColor("#00ff37");
				}else{
					aggiornaSaldo(saldo-importo,id);
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
		saldoGiocatore(id,function(saldo){
			message.reply("saldo: "+saldo);
		});
	}
}

function roulette(message){
	if(!message.member.user.bot){
	const giocata=message.content.split(" ")[1];
	const id=message.member.user.id;
	saldoGiocatore(id,function(saldo){
		var importo=parseInt(message.content.split(" ")[2]);
		if (!isNaN(importo) && importo > 0) {
			if (verificaSaldo(importo,saldo)) {
				const numeriRossi = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
				const numeriNeri =[2,4,6,8,10,11,13,15,17,20,22,24,26,28,28,31,33,35];
				const risultato = new Discord.MessageEmbed();
				const gioco = new Discord.MessageEmbed();

				gioco.setImage("https://i.imgur.com/YJu1Ced.gif");
				//calcolo numero risultato
				const resultNumeber = Math.floor(Math.random() * 36);
				if(numeriRossi.includes(resultNumeber)){
					gioco.addFields(
						{ name: "Numero fortunato: ", value: resultNumeber +" Rosso"},
					);
				}
				if(numeriNeri.includes(resultNumeber)){
					gioco.addFields(
						{ name: "Numero fortunato: ", value: resultNumeber + " Nero" },
					);
				}
				if(resultNumeber===0){
					gioco.addFields(
						{ name: "Numero fortunato: ", value: resultNumeber + " Verde"},
					);
				}

				message.channel.send(gioco);
				
				//giocata colore rosso
				if(giocata === "rosso" ||giocata === "r"){
					if(numeriRossi.includes(resultNumeber)){
						aggiornaSaldo(saldo+(importo*3),id);
						risultato.addFields(
							{ name: lingua.win, value: importo*3+' coin' },
						);
						risultato.setColor("#00ff37");
					}
					else{
						aggiornaSaldo(saldo-importo,id);
					risultato.addFields(
						{ name: lingua.lose, value: importo+' coin' },
					);
					risultato.setColor("#f50505");
				}
				message.channel.send(risultato);
				return
				}

				//giocata colore nero
				if(giocata === "nero" ||giocata === "n"){
					if(numeriNeri.includes(resultNumeber)){
						aggiornaSaldo(saldo+(importo*3),id);
						risultato.addFields(
							{ name: lingua.win, value: importo*3+' coin' },
						);
						risultato.setColor("#00ff37");
					}
						else{
							aggiornaSaldo(saldo-importo,id);
							risultato.addFields(
							{ name: lingua.lose, value: importo+' coin' },
						);
						risultato.setColor("#f50505");
					}
				message.channel.send(risultato);
				return
				}

				//giocata pari
				if(giocata === "pari" ||giocata === "p"){
					if(resultNumeber%2==0 && resultNumeber !=0){
						aggiornaSaldo(saldo+(importo*3),id);
						risultato.addFields(
							{ name: lingua.win, value: importo*3+' coin' },
						);
						risultato.setColor("#00ff37");
					}
						else{
							aggiornaSaldo(saldo-importo,id);
							risultato.addFields(
							{ name: lingua.lose, value: importo+' coin' },
						);
						risultato.setColor("#f50505");
					}
				message.channel.send(risultato);
				return
				}

				//giocata dispari
				if(giocata === "dispari" ||giocata === "d"){
					if(resultNumeber%2!=0 && resultNumeber !=0){
						aggiornaSaldo(saldo+(importo*3),id);
						risultato.addFields(
							{ name: lingua.win, value: importo*3+' coin' },
						);
						risultato.setColor("#00ff37");
					}
						else{
							aggiornaSaldo(saldo-importo,id);
							risultato.addFields(
							{ name: lingua.lose, value: importo+' coin' },
						);
						risultato.setColor("#f50505");
					}
				message.channel.send(risultato);
				return
				}

				//conversione in intero della giocata
				var intGiocata = parseInt(giocata);
				//se è un numero valido
				if(!isNaN(intGiocata)){
					//se numero giocato = risultato
					if(intGiocata === resultNumeber){
							//se 0 vincita X50
							if(resultNumeber===0){
								aggiornaSaldo(saldo+(importo*49),id);
								risultato.addFields(
									{ name: lingua.win, value: importo*40+' coin' },
								);
								risultato.setColor("#00ff37");
							}
							//ALTRO NUMERO X36
							else{
								aggiornaSaldo(saldo+(importo*35),id);
								risultato.addFields(
								{ name: lingua.win, value: importo*35+' coin' },
								);
								risultato.setColor("#00ff37");ù
							}
						}
					//se NUMERO NO UGUALE PERDITA
					else{
						aggiornaSaldo(saldo-importo,id);
						risultato.addFields(
						{ name: lingua.lose, value: importo+' coin' },
					);
					risultato.setColor("#f50505");
					}
					message.channel.send(risultato);
					return
				}
				else{
					message.reply("giocata non esisente");
					return
				}
			}
		}else{
			message.reply("importo non valito");
		}
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
comandi.set("slot",slot);
comandi.set("signin",signIn);
comandi.set("coinflip",coinflip);
comandi.set("join",join);
comandi.set("help",help);
comandi.set("saldo",getSaldo);
comandi.set("roulette",roulette);

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

//entrata nuovo utente inserimento dell'utente nel dataBase 
client.on('guildMemberAdd', member=>{
	if(!member.user.bot){
		dbpool.getConnection((err, db) => {
			const nickname=member.user.username;
			const id=member.user.id;
			var sql= `INSERT INTO utente (idutente, nickname, dataPrimoAccesso) VALUES ('${id}','${nickname}',current_timestamp())`;
			
			db.query(sql, function (err) {
				db.release();
				if(err){
					console.log(err.message);
					return
				}
				else{
					console.log("1 record inserted");
				}
			});
			
			if(err){
				console.log(err.message);
				return
			}
		});
	}
});

function saldoGiocatore(id,saldo) {
	dbpool.getConnection((err, db) => {
		var sql= `SELECT saldo FROM utente where idutente='${id}'`;	
		db.query(sql, function (err,result) {
			db.release();
			if(err){
				console.log("errore nel caricamento del tuo saldo",err);
				return
			}
			else{
				return saldo(result[0].saldo);
			}
		});
		
		if(err){
			console.log(err.message);
			return
		}
	});
}

function verificaSaldo(importo,saldo){
	if(importo <= saldo){
		return true;
	}
	else{
		return false;
	}
}

function aggiornaSaldo(nuovoSaldo,id){ 
	dbpool.getConnection((err, db) => {
		var sql= `Update utente set saldo='${nuovoSaldo}' where idutente='${id}'`;
		db.query(sql, function (err) {
			db.release();
			if(err){
				console.log("errore durante l'aggiornamento del saldo",err);
				return
			}
		});
		if(err){
			console.log(err.message);
			return
		}
	});
}