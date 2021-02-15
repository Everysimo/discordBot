const Discord = require('discord.js');
const { validateURL } = require('ytdl-core');
const client = new Discord.Client();
const config = require('./config.json');
const language =require('./language/'+config.language+'/bot.json');
const db=require("./dbOpertion.js");
const gameRoom=require("./gameRoom.js")
const musica=require("./musica.js")
const playlist=require("./playlist.js")
const command=require("./command.json")
const random=require("./random.js")
const user = require('./user.js');
db.dbConnect();
exports.client=client;

//quando il nuovo cliente è pronto esegue log
client.once('ready', () => {
	console.log('Ready!');

	client.user.setStatus("Online");

	client.user.setActivity(language.botActivity,{type:"LISTENING"});

	countMember();

	countUserOnline();
});

//Command Prefix 
const p=config.prefixCommand;

async function countMember(){
	setInterval(()=>{
		const guild = client.guilds.cache.get(config.IdServer);
		const memberCount = guild.memberCount;
		const channel=guild.channels.cache.get(config.IdMemberChannel);
		try{
			channel.setName("\uD83D\uDC65 total member "+memberCount.toString()+" \uD83D\uDC65");
		}
		catch(err){
			console.log("errore durante l'aggiornamento del canale tot member",err);
		}
	},10000);
}
async function countUserOnline(){
	setInterval(()=>{
		const guild = client.guilds.cache.get(config.IdServer);
		var onlineMember=guild.members.cache.filter(member=>member.presence.status==="online").size
		const channel=guild.channels.cache.get(config.IdMemberChannelOnline);
		try{
			channel.setName("\uD83D\uDDE3\uFE0F total online "+onlineMember.toString() + " \uD83D\uDDE3\uFE0F");
		}
		catch(err){
			console.log("errore durante l'aggiornamento del canale tot online",err);
		}
	},10000);
}

//login nel server tramite token
client.login(process.env.tokenBotDiscord);

setInterval(gameRoom.calcolaVincita, config.lottery);
setInterval(user.addCoin, config.addCoin);
setInterval(user.addTime, 1000);


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
		{ name: p+command.coin, value: language.descCoin, inline:true},
		{ name: p+command.coinflip+' *X* *value*', value: language.descCoinFlip, inline:true},
		{ name: p+command.help, value: language.descHelp, inline:true},
		{ name: p+command.join, value: language.descJoin, inline:true},
		{ name: p+command.roulette+' *X* *value*', value: language.descRoulette, inline:true},
		{ name: p+command.shop, value: language.descShop, inline:true},
		{ name: p+command.signin, value: language.descSignIn, inline:true},
		{ name: p+command.slot+' *value*', value: language.descSlot, inline:true},
		{ name: p+command.tempoOnline, value: language.descTime, inline:true},
	);

	resultMusicCommands.setTitle('Music Commands');
	resultMusicCommands.addFields(
		{ name: p+command.next, value: language.descNext, inline:true},
		{ name: p+command.play+' *url/titolo*', value: language.descPlay,inline:true},
		{ name: p+command.radio+' *number*', value: language.descRadio,inline:true},
		{ name: p+command.setvolume+' *x*', value: language.descSetVolume, inline:true},
		{ name: p+command.showradio, value: language.descShowRadio, inline:true},
		{ name: p+command.showqueue, value: language.descShowQueue, inline:true},
		{ name: p+command.stop, value: language.descStop, inline:true},
	);

	resultPlayListCommands.setTitle('PlayList Commands');
	resultPlayListCommands.addFields(
		{ name: p+command.addsongpl+' *namePl* *Url*', value: language.descAddSongPl,inline:true},
		{ name: p+command.makepl+' *namePl*', value: language.descMakePl,inline:true},
		{ name: p+command.playpl+' *namePl* *Optional:song number*', value: language.descPlayPl,inline:true},
		{ name: p+command.showpl+' *namePl*', value: language.descShowPl,inline:true},
		{ name: p+command.rmsongpl+' *namePl* *Url*', value: language.descRmSongPl,inline:true},
	);

	message.channel.send(resultBotCommands);
	message.channel.send(resultMusicCommands);
	message.channel.send(resultPlayListCommands);
}

function shop(message){
	const resultShopCommands = new Discord.MessageEmbed();

	resultShopCommands.setTitle('Shop');
	resultShopCommands.addFields(
		{ name: p+command.buypl, value: language.descBuyPl,inline:true},
		{ name: p+command.buysongs+' *namePl*', value: language.descBuySong,inline:true},
	);

	message.channel.send(resultShopCommands);
}

//mappa comandi non musicali
let comandi =new Map();
comandi.set(command.addsongpl,playlist.addSongToPL);
comandi.set(command.buybt,gameRoom.buyBiglietto);
comandi.set(command.buypl,playlist.buyPL);
comandi.set(command.buysongs,playlist.buySongs);
comandi.set(command.coin,user.printSaldo);
comandi.set(command.tempoOnline,user.printTime);
comandi.set(command.coinflip,gameRoom.coinflip);
comandi.set(command.help,help);
comandi.set(command.join,join);
comandi.set(command.makepl,playlist.createPlaylist);
comandi.set(command.next,musica.skip);
comandi.set(command.play,musica.play);
comandi.set(command.playpl,playlist.playPL);
comandi.set(command.radio,musica.playRadio);
//comandi.set(command.randomImg,random.image);
comandi.set(command.rmsongpl,playlist.removeSongFromPL);
comandi.set(command.roulette,gameRoom.roulette);
comandi.set(command.setvolume,musica.setvolume);
comandi.set(command.shop,shop);
comandi.set(command.showpl,playlist.printPL);
comandi.set(command.showradio,musica.showRadio);
comandi.set(command.showqueue,musica.showQueue);
comandi.set(command.signin,user.signIn);
comandi.set(command.slot,gameRoom.slot);
comandi.set(command.stop,musica.stop);


//gestore ricezione messaggi
client.on("message", message => {
	//se l'autore del messaggio è un bot ignora
	if (message.author.bot) {
		return;
	}// se non è bot e il messaggio inizia con "!"
	else if (message.content.startsWith(p)) {
		//salva il contenuto del messaggio corrispondente al comando
		const com=message.content.split(" ")[0].substr(p.length);
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



//test
client.on('guildMemberAdd', member => {
	console.log(member);
});