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

	countUserOnline();

	countUserOnline();
});

//Command Prefix 
const p=config.prefixCommand;

async function countUser(){
	const guild = client.guilds.cache.get('341919077008146432');
	setInterval(()=>{
		const memberCount = guild.memberCount;
		const channel=guild.channels.cache.get('808772063446827068');
		channel.setName("total member: "+memberCount.toString());
	},1000);
}
async function countUserOnline(){
	const guild = client.guilds.cache.get('341919077008146432');
	setInterval(()=>{
		const member=guild.members.cache.array();
		var onlineMember=0;
		for (let index = 0; index < member.length; index++) {
			const element = member[index];
			if (element.presence.status==="online") {
				onlineMember=onlineMember+1;
			}
		}
		const channel=guild.channels.cache.get('808787440026386452');
		channel.setName("total online: "+onlineMember.toString());
	},1000);
}


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
		{ name: p+'coin', value: language.descCoin, inline:true},
		{ name: p+'coinflip *X* *value*', value: language.descCoinFlip, inline:true},
		{ name: p+'help', value: language.descHelp, inline:true},
		{ name: p+'join', value: language.descJoin, inline:true},
		{ name: p+'roulette *X* *value*', value: language.descRoulette, inline:true},
		{ name: p+'shop', value: language.descShop, inline:true},
		{ name: p+'signin', value: language.descSignIn, inline:true},
		{ name: p+'slot *value*', value: language.descSlot, inline:true},
	);

	resultMusicCommands.setTitle('Music Commands');
	resultMusicCommands.addFields(
		{ name: p+'next', value: language.descNext, inline:true},
		{ name: p+'play *url/titolo*', value: language.descPlay,inline:true},
		{ name: p+'radio *number*', value: language.descRadio,inline:true},
		{ name: p+'setvolume *x*', value: language.descSetVolume, inline:true},
		{ name: p+'showRadio ', value: language.descShowRadio, inline:true},
		{ name: p+'stop', value: language.descStop, inline:true},
	);

	resultPlayListCommands.setTitle('PlayList Commands');
	resultPlayListCommands.addFields(
		{ name: p+'addsongpl *namePl* *Url*', value: language.descAddSongPl,inline:true},
		{ name: p+'makepl *namePl*', value: language.descMakePl,inline:true},
		{ name: p+'playpl *namePl* *Optional:song number*', value: language.descPlayPl,inline:true},
		{ name: p+'showpl *namePl*', value: language.descShowPl,inline:true},
		{ name: p+'rmsongpl *namePl* *Url*', value: language.descRmSongPl,inline:true},
	);

	message.channel.send(resultBotCommands);
	message.channel.send(resultMusicCommands);
	message.channel.send(resultPlayListCommands);
}

function shop(message){
	const resultShopCommands = new Discord.MessageEmbed();

	resultShopCommands.setTitle('Shop');
	resultShopCommands.addFields(
		{ name: p+'buypl', value: language.descBuyPl,inline:true},
		{ name: p+'buysongs *namePl*', value: language.descBuySong,inline:true},
	);

	message.channel.send(resultShopCommands);
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
			message.reply(language.msgGetCoin+saldo+" "+config.coinName);
		});
	}
}

//mappa comandi non musicali
let comandi =new Map();
comandi.set("addsongpl",playlist.addSongToPL);
comandi.set("buypl",playlist.buyPL);
comandi.set("buysongs",playlist.buySongs);
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
comandi.set("shop",shop)
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
	else if (message.content.startsWith(p)) {
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