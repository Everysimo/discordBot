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
const user = require('./user.js');
const trello=require("./trello.js")
const server=require("./server.js")
db.dbConnect();
exports.client=client;

//quando il nuovo cliente è pronto esegue log
client.once('ready', () => {
	console.log('Ready!');

	client.user.setStatus("Online");

	client.user.setActivity(language.botActivity,{type:"LISTENING"});

	setInterval(countUserOnline,10000);

	setInterval(countMember,20000);

	setInterval(gameRoom.calcolaVincita, config.lottery);

	setInterval(user.addCoin, config.addCoin);

	setInterval(user.addTime, 1000);

});

//Command Prefix 
const p=config.prefixCommand;

async function countMember(){
	
	const guild = client.guilds.cache.get(config.IdServer);
	const memberCount = guild.memberCount;
	const channel=guild.channels.cache.get(config.IdMemberChannel);
	try{
		channel.setName("\uD83D\uDC65 total member "+memberCount.toString()+" \uD83D\uDC65");
	}
	catch(err){
		console.log("errore durante l'aggiornamento del canale tot member",err);
	}
	
}
async function countUserOnline(){
	
	const guild = client.guilds.cache.get(config.IdServer);
	var onlineMember=guild.members.cache.filter(member=>member.presence.status==="online").size
	const channel=guild.channels.cache.get(config.IdMemberChannelOnline);
	try{
		channel.setName("\uD83D\uDDE3\uFE0F total online "+onlineMember.toString() + " \uD83D\uDDE3\uFE0F");
	}
	catch(err){
		console.log("errore durante l'aggiornamento del canale tot online",err);
	}
	
}

//login nel server tramite token
client.login(process.env.tokenBotDiscord);



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
comandi.set(command.rmsongpl,playlist.removeSongFromPL);
comandi.set(command.roulette,gameRoom.roulette);
comandi.set(command.setvolume,musica.setvolume);
comandi.set(command.setserver,setServer);
comandi.set(command.shop,shop);
comandi.set(command.showpl,playlist.printPL);
comandi.set(command.showradio,musica.showRadio);
comandi.set(command.showqueue,musica.showQueue);
comandi.set(command.signin,user.signIn);
comandi.set(command.slot,gameRoom.slot);
comandi.set(command.stop,musica.stop);
comandi.set(command.suggestion,trello.addSuggestion);


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

client.on('guildMemberAdd', member => {
	const channel=client.channels.cache.get("804669088688242768");
	if(!member.user.bot){
		dbpool.getConnection((err, db) => {
			const nickname=member.user.username;
			const id=member.user.id;
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
						console.log(language.dbMsgUserAlreadySigned);
						channel.send(messaggioRifiuto)
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
					channel.send(messaggioConferma)
					console.log(language.dbMsgUserCorrectlySigned);
					user.aggiornaRuolo(member,1);
				}
			});
			
			if(err){
				console.log(language.errorDataBaseConnectionFailed,err);
				return
			}
		});
	}
});

client.on('guildCreate',guild=>{
	//TODO codificare le cose da fare quando il bot entra in un nuovo server
});

function setServer(message){
	const guild = message.member.guild;
	var serverInfo=new server.Server();
	serverInfo.id=guild.id;
	guild.channels.create("🤖comandi-bot🤖",{type:"text"}).then(channel=>{
		serverInfo.command=channel.id;
		console.log("canale: "+channel)
	});
	guild.channels.create("🎰gameroom🎰",{type:"text"}).then(channel=>{
		serverInfo.gameroom=channel.id;
	});
	guild.channels.create("🎫lottery🎫",{type:"text"}).then(channel=>{
		serverInfo.lottery=channel.id;
	});
	guild.channels.create("🥇levelUp🥇",{type:"text"}).then(channel=>{
		serverInfo.level=channel.id;
	});
	guild.channels.create("📊 Server Stats 📊",{type:"category"}).then(category=>{
		guild.channels.create("👥 total member 👥",{type:"voice"}).then(channel=>{
			channel.setParent(category);
			serverInfo.totalMember=channel.id;
			console.log("canale in categoria: "+channel)
		})
		guild.channels.create("🗣 total online 🗣",{type:"voice"}).then(channel=>{
			channel.setParent(category);
			serverInfo.totalOnline=channel.id;
		})
	});
	guild.roles.create({data:{color:"#a19d94",name:"IRON MEMBER",hoist:true}}).then(role=>{
		serverInfo.iron=role.id;
		console.log("role:"+channel)
	});
	guild.roles.create({data:{color:"#cd7f32",name:"BRONZE MEMBER",hoist:true}}).then(role=>{
		serverInfo.bronze=role.id;
	});
	guild.roles.create({data:{color:"#7b99b7",name:"SILVER MEMBER",hoist:true}}).then(role=>{
		serverInfo.silver=role.id;
	});
	guild.roles.create({data:{color:"#FFD700",name:"GOLDEN MEMBER",hoist:true}}).then(role=>{
		serverInfo.golden=role.id;
	});
	guild.roles.create({data:{color:"#92008f",name:"OBSIDIAN MEMBER",hoist:true}}).then(role=>{
		serverInfo.obsidian=role.id;
	});
	guild.roles.create({data:{color:"#00c7c7",name:"DIAMOND MEMBER",hoist:true}}).then(role=>{
		serverInfo.diamond=role.id;
	});
	guild.roles.create({data:{color:"#50c878",name:"EMERALD MEMBER",hoist:true}}).then(role=>{
		serverInfo.emerald=role.id;
	});
	db.inserServerInfo(serverInfo);
}