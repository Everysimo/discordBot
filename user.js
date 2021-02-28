const Discord = require('discord.js');
const config = require('./config.json');
const language=require("./language.js")
const bot = require('./bot');
const srv = require('./server');

async function addCoin(){ 
	const guild = bot.client.guilds.cache.array();
	for (let i = 0; i < guild.length; i++) {
		const element = guild[i];
		const activeMember= await element.members.cache.filter(member=>member.voice.channel!==null).array();
		for (let index = 0; index < activeMember.length; index++) {
			var id = activeMember[index].id;
			applyAddCoin(id,config.coinForTime)
		}
	}
}
exports.addCoin = addCoin;

function applyAddCoin(id,coin){
	getSaldoGiocatore(id,saldo=>{
		aggiornaSaldo(saldo+(coin),id);
	});
}

function applyRemoveCoin(id,coin){
	getSaldoGiocatore(id,saldo=>{
		aggiornaSaldo(saldo-(coin),id);
	});
}

async function addTime(){ 
	const guild = bot.client.guilds.cache.array();
	for (let i = 0; i < guild.length; i++) {
		const element = guild[i];
		const activeMember= await element.members.cache.filter(member=>member.voice.channel!==null).array();
		for (let index = 0; index < activeMember.length; index++) {
			applyAddTime(activeMember[index],element.id)
		}
	}
	
}
exports.addTime = addTime;

function applyAddTime(user,server){
	
	getTempoOnlineSeconds(user.id,server,function(tempoOnline,daysOnline){
		tempoOnline+=1;
		if(tempoOnline>=86400){
			daysOnline++;
			tempoOnline-=86400;
			if(daysOnline==7||daysOnline==14||daysOnline==21||daysOnline==28||daysOnline==54||daysOnline==100){
				aggiornaRuolo(user,daysOnline,server);
			}
			
		}

		aggiornaTempoOnline(tempoOnline,daysOnline,user.id,server);
	});
}

function aggiornaSaldo(nuovoSaldo,id){ 

		var sql= `Update utente set saldo='${nuovoSaldo}' where idutente='${id}'`;
		dbpool.query(sql, function (err) {
			if(err){
				console.log(language.langPack.ita.get("errorUpdateCoin"),err);
				return
			}
		});
}
exports.aggiornaSaldo = aggiornaSaldo;

function aggiornaRuolo(user,days,serverId){
	const message = new Discord.MessageEmbed();
	const ser = srv.servers.find(server => 
		server.id === serverId
	);
	switch(days){
		case 1:
			try {
				user.roles.add(ser.iron,"Welcome");
				message.setTitle(language.langPack.ita.get("msgWelcomeRole"));
				message.setDescription(`<@${user.id}>`+language.langPack.ita.get("msgMemberLvl0"));
			}catch(err){
				console.log(language.langPack.ita.get("errorAddingRole"),err);
			}
			break;
		case 7:
			try{
				user.roles.remove(ser.iron,"7 days online");
			}catch(err){
				console.log(language.langPack.ita.get("errorUserNotFound"));
			}
			try {
				user.roles.add(ser.bronze,"7 days online");
				message.setTitle(language.langPack.ita.get("msgNextLvlRole"));
				message.setDescription(`<@${user.id}>`+language.langPack.ita.get("msgMemberLvl1"));
			}catch(err){
				console.log(language.langPack.ita.get("errorAddingRole"));
			}
			break;
		case 14:
			try{
				user.roles.remove(ser.bronze,"14 days online");
			}catch(err){
				console.log(language.langPack.ita.get("errorUserNotFound"));
			}
			try {
				user.roles.add(ser.silver,"14 days online");
				message.setTitle(language.langPack.ita.get("msgNextLvlRole"));
				message.setDescription(`<@${user.id}>`+language.langPack.ita.get("msgMemberLvl2"));
			}catch(err){
				console.log(language.langPack.ita.get("errorAddingRole"));
			}
			break;
		case 21:
			try{
				user.roles.remove(ser.silver,"21 days online");
			}catch(err){
				console.log(language.langPack.ita.get("errorUserNotFound"));
			}
			try {
				user.roles.add(ser.golden,"21 days online");
				message.setTitle(language.langPack.ita.get("msgNextLvlRole"));
				message.setDescription(`<@${user.id}>`+language.langPack.ita.get("msgMemberLvl3"));
			}catch(err){
				console.log(language.langPack.ita.get("errorAddingRole"));
			}
			break;
		case 28:
			try{
				user.roles.remove(ser.golden,"28 days online");
			}
			catch(err){
				console.log(language.langPack.ita.get("errorUserNotFound"));
			}
			try {
				user.roles.add(ser.obsidian,"28 days online");
				message.setTitle(language.langPack.ita.get("msgNextLvlRole"));
				message.setDescription(`<@${user.id}>`+language.langPack.ita.get("msgMemberLvl4"));
			}
			catch(err){
				console.log(language.langPack.ita.get("errorAddingRole"));
			}
			break;
		case 54:
			try{
				user.roles.remove(ser.obsidian,"54 days online");
			}
			catch(err){
				console.log(language.langPack.ita.get("errorUserNotFound"));
			}
			try {
				user.roles.add(ser.diamond,"54 days online");
				message.setTitle(language.langPack.ita.get("msgNextLvlRole"));
				message.setDescription(`<@${user.id}>`+language.langPack.ita.get("msgMemberLvl5"));
			}
			catch(err){
				console.log(language.langPack.ita.get("errorAddingRole"));
			}
				break;
		case 100:
			try{
				user.roles.remove(ser.diamond,"100 days online");
			}
			catch(err){
				console.log(language.langPack.ita.get("errorUserNotFound"));
			}
			try {
				user.roles.add(ser.emerald,"100 days online");
				message.setTitle(language.langPack.ita.get("msgNextLvlRole"));
				message.setDescription(`<@${user.id}>`+language.langPack.ita.get("msgMemberLvl6"));
			}
			catch(err){
				console.log(language.langPack.ita.get("errorAddingRole"));
			}
			break;
	}
	const channel=bot.client.channels.cache.get(ser.level);
	channel.send(message);
}
exports.aggiornaRuolo = aggiornaRuolo;

function aggiornaTempoOnline(nuovoTempo,newDays,id,server){
		var sql= `Update server_account set tempoOnline=SEC_TO_TIME('${nuovoTempo}'),daysOnline=('${newDays}') where utente='${id}' AND server='${server}'`;
		dbpool.query(sql, function (err) {
			if(err){
				console.log(language.langPack.ita.get("errorUpdateOnlineTime"),err);
				return
			}
		});
}

function getTempoOnline (id,server,tempoOnline) {
		var sql= `SELECT tempoOnline,daysOnline FROM server_account where utente='${id}' AND server='${server}'`;	
		dbpool.query(sql, function (err,result) {
			if(err){
				console.log(language.langPack.ita.get("errorGetOnlineTime"),err);
				return
			}
			else{
				if (result.length!==0) {
					return tempoOnline(result[0].tempoOnline,result[0].daysOnline);
				}
			}
		});
}
exports.getTempoOnline = getTempoOnline;

function getTempoOnlineSeconds (id,server,tempoOnline) {
		var sql= `SELECT TIME_TO_SEC(tempoOnline) as time,daysOnline FROM server_account where utente='${id}' AND server='${server}'`;	
		dbpool.query(sql, function (err,result) {
			if(err){
				console.log(language.langPack.ita.get("errorGetOnlineTime"),err);
				return
			}
			else{
				if (result.length!==0) {
					return tempoOnline(result[0].time,result[0].daysOnline);
				}
			}
		});
}
exports.getTempoOnlineSeconds = getTempoOnlineSeconds;

function getSaldoGiocatore (id,saldo) {
		var sql= `SELECT saldo FROM utente where idutente='${id}'`;	
		dbpool.query(sql, function (err,result) {
			if(err){
				console.log(language.langPack.ita.get("errorGetCoin"),err);
				return
			}
			else{
				if (result.length!==0) {
					return saldo(result[0].saldo);
				}
			}
		});
}
exports.getSaldoGiocatore = getSaldoGiocatore;

function printSaldo(message){
	if(!message.member.user.bot){
		const id=message.member.user.id;
		getSaldoGiocatore(id,function(saldo){
			message.reply(language.langPack.ita.get("msgGetCoin")+saldo+" "+config.coinName);
		});
	}
}
exports.printSaldo = printSaldo;

function printTime(message){
	if(!message.member.user.bot){
		const id=message.member.user.id;
		getTempoOnline(id,message.guild.id,function(tempoOnline,daysOnline){
			message.reply(language.langPack.ita.get("msgGetTime")+daysOnline+language.langPack.ita.get("daysAnd")+tempoOnline);
		});
	}
}
exports.printTime = printTime;

/*function sleep(milliseconds) {
	const date = Date.now();
	let currentDate = null;
	do {
	  currentDate = Date.now();
	} while (currentDate - date < milliseconds);
}*/

function signIn(message){
	if(!message.member.user.bot){
			const nickname=message.member.user.username;
			const id=message.member.user.id;
			const server=message.guild.id;
			const channel=message.channel;
			const member=message.member;
			insertUtente(id,nickname);
			insertServerAccount(id,server,channel,member);
	}
}
exports.signIn = signIn;

function insertUtente(id,nickname){
	dbpool.getConnection((err, db) => {
		var sql= `INSERT INTO utente (idutente, nickname) VALUES ('${id}','${nickname}')`;
		
		db.query(sql, function (err) {
			db.release();
			if(err){
				if(err.code.match('ER_DUP_ENTRY')){
					console.log("utente già presente nel database");
					return
				}
			}	
			else{
				console.log("nuovo utente aggiunto al database");
				return
			}
		});

		
		if(err){
			console.log(language.langPack.ita.get("errorDataBaseConnectionFailed"),err);
			return
		}
	});
}

function insertServerAccount(utente,server,channel,member){
	dbpool.getConnection((err, db) => {
		var sql= `INSERT INTO server_account (utente, server) VALUES ('${utente}','${server}')`;
		
		db.query(sql, function (err) {
			db.release();
			if(err){
				if(err.code.match('ER_DUP_ENTRY')){

					const messaggioRifiuto = new Discord.MessageEmbed();
					messaggioRifiuto.setDescription(language.langPack.ita.get("titleMsgAlreadySignedIn")+` <@${utente}>`);
					messaggioRifiuto.addFields(
						{ name: language.langPack.ita.get("msgAlreadySignedIn"),
						 value: language.langPack.ita.get("msgDescAlreadySignIn"), inline:true},
					)
				
					console.log(language.langPack.ita.get("dbMsgUserAlreadySigned"));
					channel.send(messaggioRifiuto);
					return
				}
			}	
			else{
				const messaggioConferma = new Discord.MessageEmbed();
				messaggioConferma.setDescription(language.langPack.ita.get("titleMsgWelcomeSignIn")+` <@${utente}>`);
				messaggioConferma.addFields(
					{ name: language.langPack.ita.get("msgWelcomeSignIn"),
					 value: language.langPack.ita.get("msgDescWelcomeSignIn"), inline:true},
				)

				console.log(language.langPack.ita.get("dbMsgUserCorrectlySigned"));
				channel.send(messaggioConferma);
				aggiornaRuolo(member,1,server);
				return 
			}
		});

		
		if(err){
			console.log(language.langPack.ita.get("errorDataBaseConnectionFailed"),err);
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
exports.verificaSaldo=verificaSaldo;

function getUsersSignedIn(users){
	var sql= `SELECT idutente FROM utente`;	
		dbpool.query(sql, function (err,result) {
			if(err){
				console.log(language.langPack.ita.get("errorGetCoin"),err);
				return
			}
			else{
				if (result.length!==0) {
					return users(result[0].idutente);
				}
			}
		});
}
exports.getUsersSignedIn = getUsersSignedIn;

function sendCoin(message){
	var id_sender=message.member.id;
	var receivers=new Array();
	receivers=receivers.concat(message.mentions.members.array());
	receiversRole=message.mentions.roles.array()
	for (let index = 0; index < array.length; index++) {
		const element = array[index].members;
		receivers=receivers.concat(element);
	}
	console.log(receivers);
	var money=parseInt(message.content.split(" ")[message.content.split(" ").length-1]);
	console.log(money);

	for(let index=0;index<receivers.length;index++){
		id_receiver=receivers[index].id;
		console.log(id_receiver);
		try{
			applyRemoveCoin(id_sender,money);
		}
		catch{
			message.reply("saldo non inviato");
			return
		}
	
		try{
			applyAddCoin(id_receiver,money);
		}
		catch{
			message.reply("saldo non inviato");
			return
		}
	}

	message.reply("saldo inviato");
}
exports.sendCoin = sendCoin;