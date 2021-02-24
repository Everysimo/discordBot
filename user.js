const Discord = require('discord.js');
const config = require('./config.json');
const language =require('./language/'+config.language+'/user.json');
const bot = require('./bot');
const { servers } = require('./server');

async function addCoin(){ 
	const guild = bot.client.guilds.cache.array();
	for (let i = 0; i < guild.length; i++) {
		const element = guild[i];
		const activeMember= await element.members.cache.filter(member=>member.voice.channel!==null).array();
		for (let index = 0; index < activeMember.length; index++) {
			var id = activeMember[index].id;
			applyAddCoin(id)
		}
	}
}
exports.addCoin = addCoin;

function applyAddCoin(id){
	getSaldoGiocatore(id,saldo=>{
		aggiornaSaldo(saldo+(config.coinForTime),id);
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
				aggiornaRuolo(user,daysOnline);
			}
			
		}

		aggiornaTempoOnline(tempoOnline,daysOnline,user.id,server);
	});
}

function aggiornaSaldo(nuovoSaldo,id){ 

		var sql= `Update utente set saldo='${nuovoSaldo}' where idutente='${id}'`;
		dbpool.query(sql, function (err) {
			if(err){
				console.log(language.errorUpdateCoin,err);
				return
			}
		});
}
exports.aggiornaSaldo = aggiornaSaldo;

function aggiornaRuolo(user,days){
	const message = new Discord.MessageEmbed();
	switch(days){
		case 1:
			try {
				user.roles.add("812012075114561536","Welcome");
				message.setTitle(language.msgWelcomeRole);
				message.setDescription(`<@${user.id}>`+language.msgMemberLvl0);
			}catch(err){
				console.log(language.errorAddingRole,err);
			}
			break;
		case 7:
			try{
				user.roles.remove("812012075114561536","7 days online");
			}catch(err){
				console.log(language.errorUserNotFound);
			}
			try {
				user.roles.add("812013606308675616","7 days online");
				message.setTitle(language.msgNextLvlRole);
				message.setDescription(`<@${user.id}>`+language.msgMemberLvl1);
			}catch(err){
				console.log(language.errorAddingRole);
			}
			break;
		case 14:
			try{
				user.roles.remove("812013606308675616","14 days online");
			}catch(err){
				console.log(language.errorUserNotFound);
			}
			try {
				user.roles.add("812466129879957554","14 days online");
				message.setTitle(language.msgNextLvlRole);
				message.setDescription(`<@${user.id}>`+language.msgMemberLvl2);
			}catch(err){
				console.log(language.errorAddingRole);
			}
			break;
		case 21:
			try{
				user.roles.remove("812466129879957554","21 days online");
			}catch(err){
				console.log(language.errorUserNotFound);
			}
			try {
				user.roles.add("812022805926379550","21 days online");
				message.setTitle(language.msgNextLvlRole);
				message.setDescription(`<@${user.id}>`+language.msgMemberLvl3);
			}catch(err){
				console.log(language.errorAddingRole);
			}
			break;
		case 28:
			try{
				user.roles.remove("812022805926379550","28 days online");
			}
			catch(err){
				console.log(language.errorUserNotFound);
			}
			try {
				user.roles.add("812466220162351165","28 days online");
				message.setTitle(language.msgNextLvlRole);
				message.setDescription(`<@${user.id}>`+language.msgMemberLvl4);
			}
			catch(err){
				console.log(language.errorAddingRole);
			}
			break;
		case 54:
			try{
				user.roles.remove("812466220162351165","54 days online");
			}
			catch(err){
				console.log(language.errorUserNotFound);
			}
			try {
				user.roles.add("812466432243531818","54 days online");
				message.setTitle(language.msgNextLvlRole);
				message.setDescription(`<@${user.id}>`+language.msgMemberLvl5);
			}
			catch(err){
				console.log(language.errorAddingRole);
			}
				break;
		case 100:
			try{
				user.roles.remove("812466432243531818","100 days online");
			}
			catch(err){
				console.log(language.errorUserNotFound);
			}
			try {
				user.roles.add("812466592641449994","100 days online");
				message.setTitle(language.msgNextLvlRole);
				message.setDescription(`<@${user.id}>`+language.msgMemberLvl6);
			}
			catch(err){
				console.log(language.errorAddingRole);
			}
			break;
	}
	const channel=bot.client.channels.cache.get(config.promotionChannel);
	channel.send(message);
}
exports.aggiornaRuolo = aggiornaRuolo;

function aggiornaTempoOnline(nuovoTempo,newDays,id,server){
		var sql= `Update server_account set tempoOnline=SEC_TO_TIME('${nuovoTempo}'),daysOnline=('${newDays}') where utente='${id}' AND server='${server}'`;
		dbpool.query(sql, function (err) {
			if(err){
				console.log(language.errorUpdateOnlineTime,err);
				return
			}
		});
}

function getTempoOnline (id,server,tempoOnline) {
		var sql= `SELECT tempoOnline,daysOnline FROM server_account where utente='${id}' AND server='${server}'`;	
		dbpool.query(sql, function (err,result) {
			if(err){
				console.log(language.errorGetOnlineTime,err);
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
				console.log(language.errorGetOnlineTime,err);
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
				console.log(language.errorGetCoin,err);
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
			message.reply(language.msgGetCoin+saldo+" "+config.coinName);
		});
	}
}
exports.printSaldo = printSaldo;

function printTime(message){
	if(!message.member.user.bot){
		const id=message.member.user.id;
		getTempoOnline(id,function(tempoOnline,daysOnline){
			message.reply(language.msgGetTime+daysOnline+language.daysAnd+tempoOnline);
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
			insertUtente(id,nickname);
			insertServerAccount(id,server);
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
			console.log(language.errorDataBaseConnectionFailed,err);
			return
		}
	});
}

function insertServerAccount(utente,server){
	dbpool.getConnection((err, db) => {
		var sql= `INSERT INTO server_account (utente, server) VALUES ('${utente}','${server}')`;
		
		db.query(sql, function (err) {
			db.release();
			if(err){
				if(err.code.match('ER_DUP_ENTRY')){

					const messaggioRifiuto = new Discord.MessageEmbed();
					messaggioRifiuto.setDescription(language.titleMsgAlreadySignedIn+` <@${utente}>`);
					messaggioRifiuto.addFields(
						{ name: language.msgAlreadySignedIn,
						 value: language.msgDescAlreadySignIn, inline:true},
					)
				
					console.log(language.dbMsgUserAlreadySigned);
					message.channel.send(messaggioRifiuto);
					return
				}
			}	
			else{
				const messaggioConferma = new Discord.MessageEmbed();
				messaggioConferma.setTitle(language.titleMsgWelcomeSignIn+` <@${utente}>`);
				messaggioConferma.addFields(
					{ name: language.msgWelcomeSignIn,
					 value: language.msgDescWelcomeSignIn, inline:true},
				)

				console.log(language.dbMsgUserCorrectlySigned);
				message.channel.send(messaggioConferma);
				aggiornaRuolo(message.member,1);
				return 
			}
		});

		
		if(err){
			console.log(language.errorDataBaseConnectionFailed,err);
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
				console.log(language.errorGetCoin,err);
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