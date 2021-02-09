const Discord = require('discord.js');
const { validateURL } = require('ytdl-core');
const client = new Discord.Client();
const config = require('./config.json');
const language =require('./language/'+config.language+'/bot.json');
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

	client.user.setActivity(language.botActivity,{type:"LISTENING"});
});

//prefixCommand comandi non musica !
const pnm=config.prefixCommand;

//login nel server tramite token
client.login(process.env.tokenBotDiscord);

//setInterval(gameRoom.calcolaVincita, config.lottery);

//il bot join nel canale vocale del mittente del messaggio
async function join(message){
	const voiceChannel = message.member.voice.channel;	//memorizza il canale vocale del mittente del messaggio
	if (!voiceChannel){
		return message.reply(language.voiceChannelNotFound);
	}
	else{
		const permissions = voiceChannel.permissionsFor(message.client.user);	//verifica permessi utente che richiama il messggio
  		if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    		return message.reply(language.voiceChannelNotPermission);
		}
		else{
			try{
				await voiceChannel.join();
			}
			catch(err){
				console.log(err.stack);
				return message.reply(language.errorJoinVoiceChannel);
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
		{ name: '!coinflip *X* *value*', value: language.descCoinFlip, inline:true},
		{ name: '!help', value: language.descHelp, inline:true},
		{ name: '!join', value: language.descJoin, inline:true},
		{ name: '!roulette *X* *value*', value: language.descRoulette, inline:true},
		{ name: '!coin', value: language.descCoin, inline:true},
		{ name: '!signin', value: language.descSignIn, inline:true},
		{ name: '!slot *value*', value: language.descSlot, inline:true},
	);

	resultMusicCommands.setTitle('Music Commands');
	resultMusicCommands.addFields(
		{ name: '!next', value: language.descNext, inline:true},
		{ name: '!play *url/titolo*', value: language.descPlay,inline:true},
		{ name: '!radio *number*', value: language.descRadio,inline:true},
		{ name: '!setvolume *x*', value: language.descSetVolume, inline:true},
		{ name: '!showRadio ', value: language.descShowRadio, inline:true},
		{ name: '!stop', value: language.descStop, inline:true},
	);

	resultPlayListCommands.setTitle('PlayList Commands');
	resultPlayListCommands.addFields(
		{ name: '!addsongpl *namePl* *Url*', value: language.descAddSongPl,inline:true},
		{ name: '!makepl *namePl*', value: language.descMakePl,inline:true},
		{ name: '!playpl *namePl* *Optional:song number*', value: language.descPlayPl,inline:true},
		{ name: '!showpl *namePl*', value: language.descShowPl,inline:true},
		{ name: '!rmsongpl *namePl* *Url*', value: language.descRmSongPl,inline:true},
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
						messaggioRifiuto.setTitle(language.titleMsgAlreadySignedIn + nickname);
						messaggioRifiuto.addFields(
							{ name: language.msgAlreadySignedIn,
							 value: language.msgDescAlreadySignIn, inline:true},
						)
					
						console.log(language.dbMsgUserCorrectlySigned);
						message.channel.send(messaggioRifiuto);
						return
					}
				}	
				else{
					const messaggioConferma = new Discord.MessageEmbed();
					messaggioConferma.setTitle(language.titleMsgWelcomeSignIn + nickname);
					messaggioConferma.addFields(
						{ name: language.msgWelcomeSignIn,
						 value: language.msgDescWelcomeSignIn, inline:true},
					)

					console.log(language.dbMsgUserAlreadySigned);
					message.channel.send(messaggioConferma);
				}
			});
			
			if(err){
				console.log(language.errorDataBaseConnectionFailed,err);
				return
			}
		});
	}
}

function getSaldo(message){
	if(!message.member.user.bot){
		const id=message.member.user.id;
		db.saldoGiocatore(id,function(saldo){
			message.reply(language.msgGetCoin+saldo);
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
			message.reply(language.commandNotFound);
		}
	}
});