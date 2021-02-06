const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
const lingua =require(config.lingua);
const db=require("./dbOpertion.js");
const gameRoom=require("./gameRoom.js")
const musica=require("./musica.js")
const playlist=require("./playlist.js")
db.dbConnect();

//quando il nuovo cliente è pronto esegue log
client.once('ready', () => {
	console.log('Ready!');
});

//prefisso comandi non musica !
const pnm=config.prefissoNonMusica;

//login nel server tramite token
client.login(process.env.tokenBotDiscord);

setInterval( gameRoom.estrai(client), 60000);

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
		{ name: '!play', value: 'aggiungi una canzone alla coda di riproduzione e falla prartire se non c\'è nulla in coda',inline:true},
		{ name: '!setvolume x', value: 'setta volume a x (0-100 )', inline:true},
		{ name: '!skip', value: 'skip di una canzone dalla coda', inline:true},
		{ name: '!stop', value: 'interruzione della riproduzione ed eliminazione della coda di riproduzione', inline:true},
		{ name: '!volumedown x', value: 'abbassa il volume di x(0-100)', inline:true},
		{ name: '!volumeup x', value: 'alza il volume di x(0-100)', inline:true},
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

//mappa comandi non musicali
let comandi =new Map();
comandi.set("addsongpl",playlist.addSongToPL);
comandi.set("rmsongpl",playlist.removeSongFromPL);
comandi.set("slot",gameRoom.slot);
comandi.set("signin",signIn);
comandi.set("coinflip",gameRoom.coinflip);
comandi.set("creapl",playlist.createPlaylist);
comandi.set("printPL",playlist.printPL);
comandi.set("join",join);
comandi.set("help",help);
comandi.set("saldo",getSaldo);
comandi.set("roulette",gameRoom.roulette);
comandi.set("playPL",playlist.playPL);
comandi.set("play",musica.play);
comandi.set("skip",musica.skip);
comandi.set("stop",musica.stop);
comandi.set("volumeup",musica.volumeUp);
comandi.set("volumedown",musica.volumeDown);
comandi.set("setvolume",musica.setvolume);

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
});
