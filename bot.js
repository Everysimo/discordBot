const Discord = require('discord.js');
const { validateURL } = require('ytdl-core');
const client = new Discord.Client();
const config = require('./config.json');
const lingua =require(config.lingua);
const db=require("./dbOpertion.js");
const gameRoom=require("./gameRoom.js")
const musica=require("./musica.js")
const playlist=require("./playlist.js")
db.dbConnect();
exports.client=client;
//quando il nuovo cliente è pronto esegue log
client.once('ready', () => {
	console.log('Ready!');

	client.user.setStatus("Online");

	client.user.setActivity("Al suo servizio padrone umano, !help",{type:"WATCHING"});
});

//prefisso comandi non musica !
const pnm=config.prefissoNonMusica;

//login nel server tramite token
client.login(process.env.tokenBotDiscord);

//setInterval(gameRoom.lotteria, config.lotteria);

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
	const resultBotCommands = new Discord.MessageEmbed();
	const resultMusicCommands = new Discord.MessageEmbed();
	const resultPlayListCommands = new Discord.MessageEmbed();

	resultBotCommands.setTitle('HydraBot');
	resultBotCommands.setDescription('Bot Commands');
	resultBotCommands.addFields(
		{ name: '!coinflip *X* *value*', value: lingua.descCoinFlip, inline:true},
		{ name: '!help', value: lingua.descHelp, inline:true},
		{ name: '!join', value: lingua.descJoin, inline:true},
		{ name: '!roulette *X* *value*', value: lingua.descRoulette, inline:true},
		{ name: '!coin', value: lingua.descCoin, inline:true},
		{ name: '!signin', value: lingua.descSignIn, inline:true},
		{ name: '!slot *value*', value: lingua.descSlot, inline:true},
	);

	resultMusicCommands.setTitle('Music Commands');
	resultMusicCommands.addFields(
		{ name: '!next', value: lingua.descNext, inline:true},
		{ name: '!play *url/titolo*', value: lingua.descPlay,inline:true},
		{ name: '!radio *number*', value: lingua.descRadio,inline:true},
		{ name: '!setvolume *x*', value: lingua.descSetVolume, inline:true},
		{ name: '!showRadio ', value: lingua.descShowRadio, inline:true},
		{ name: '!stop', value: lingua.descStop, inline:true},
	);

	resultPlayListCommands.setTitle('PlayList Commands');
	resultPlayListCommands.addFields(
		{ name: '!addsongpl *namePl* *Url*', value: lingua.descAddSongPl,inline:true},
		{ name: '!makepl *namePl*', value: lingua.descMakePl,inline:true},
		{ name: '!playpl *namePl* *Optional:song number*', value: lingua.descPlayPl,inline:true},
		{ name: '!showpl *namePl*', value: lingua.descShowPl,inline:true},
		{ name: '!rmsongpl *namePl* *Url*', value: lingua.descRmSongPl,inline:true},
	);

	message.channel.send(resultBotCommands);
	message.channel.send(resultMusicCommands);
	message.channel.send(resultPlayListCommands);
}

function signIn(message){
	if(!message.member.user.bot){
		dbpool.getConnection((err, db) => {
			const nickname=message.member.user.username;
			const id=message.member.user.id;
			var sql= `INSERT INTO utente (idutente, nickname) VALUES ('${id}','${nickname}')`;
			
			db.query(sql, function (err) {
				db.release();
				if(err){
					if(err.code.match('ER_DUP_ENTRY')){

						const messaggioRifiuto = new Discord.MessageEmbed();
						messaggioRifiuto.setTitle(lingua.titleMsgAlreadySignedIn + nickname);
						messaggioRifiuto.addFields(
							{ name: lingua.msgAlreadySignedIn,
							 value: lingua.msgDescAlreadySignIn, inline:true},
						)
					
						console.log(lingua.dbMsgUserCorrectlySigned);
						message.channel.send(messaggioRifiuto);
						return
					}
				}	
				else{
					const messaggioConferma = new Discord.MessageEmbed();
					messaggioConferma.setTitle(lingua.titleMsgWelcomeSignIn + nickname);
					messaggioConferma.addFields(
						{ name: lingua.msgWelcomeSignIn,
						 value: lingua.msgDescWelcomeSignIn, inline:true},
					)

					console.log(lingua.dbMsgUserAlreadySigned);
					message.channel.send(messaggioConferma);
				}
			});
			
			if(err){
				console.log(lingua.errorDataBaseConnectionFailed,err);
				return
			}
		});
	}
}

function getSaldo(message){
	if(!message.member.user.bot){
		const id=message.member.user.id;
		db.saldoGiocatore(id,function(saldo){
			message.reply(lingua.msgGetCoin+saldo);
		});
	}
}

//mappa comandi non musicali
let comandi =new Map();
comandi.set("addsongpl",playlist.addSongToPL);
comandi.set("coin",getSaldo);
comandi.set("coinflip",gameRoom.coinflip);
comandi.set("makepl",playlist.createPlaylist);
comandi.set("help",help);
comandi.set("join",join);
comandi.set("next",musica.skip);
comandi.set("play",musica.play);
comandi.set("playpl",playlist.playPL);
comandi.set("showpl",playlist.printPL);
comandi.set("buypl",playlist.buyPL);
comandi.set("buysong",playlist.buySong);
comandi.set("buybt",gameRoom.buyBiglietto);
comandi.set("radio",musica.playRadio);
comandi.set("rmsongpl",playlist.removeSongFromPL);
comandi.set("roulette",gameRoom.roulette);
comandi.set("setvolume",musica.setvolume);
comandi.set("showradio",musica.showRadio);
comandi.set("signin",signIn);
comandi.set("slot",gameRoom.slot);
comandi.set("stop",musica.stop);

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