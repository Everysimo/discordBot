const Discord = require('discord.js');
const config = require('./config.json');
const language =require('./language/'+config.language+'/user.json');
const bot = require('./bot');

async function addCoin(){ 
	const guild = bot.client.guilds.cache.get(config.IdServer);
	const activeMember= await guild.members.cache.filter(member=>member.voice.channel!==null).array();
	for (let index = 0; index < activeMember.length; index++) {
		var id = activeMember[index].id;
		applyAddCoin(id)
	}
}
exports.addCoin = addCoin;

function applyAddCoin(id){
	getSaldoGiocatore(id,saldo=>{
		aggiornaSaldo(saldo+(config.coinForTime),id);
	});
}

async function addTime(){ 
	const guild = bot.client.guilds.cache.get(config.IdServer);
	const activeMember= await guild.members.cache.filter(member=>member.voice.channel!==null).array();
	for (let index = 0; index < activeMember.length; index++) {
		var id = activeMember[index].id;
		applyAddTime(id)
	}
}
exports.addTime = addTime;

function applyAddTime(id){
	getTempoOnlineSeconds(id,function(tempoOnline,daysOnline){
		
		tempoOnline++;
		if(tempoOnline>=86400){
			daysOnline++;
			tempoOnline-=86400;
		}

		aggiornaTempoOnline(tempoOnline,daysOnline,id);
	});
}

function aggiornaSaldo(nuovoSaldo,id){ 
	dbpool.getConnection((err, db) => {
		var sql= `Update utente set saldo='${nuovoSaldo}' where idutente='${id}'`;
		db.query(sql, function (err) {
			db.release();
			if(err){
				console.log(language.errorUpdateCoin);
				return
			}
		});
		if(err){
			console.log(language.errorDataBaseConnectionFailed,err);
			return
		}
	});
}
exports.aggiornaSaldo = aggiornaSaldo;

function aggiornaTempoOnline(nuovoTempo,newDays,id){
	dbpool.getConnection((err, db) => {
		var sql= `Update utente set tempoOnline=SEC_TO_TIME('${nuovoTempo}'),daysOnline=('${newDays}') where idutente='${id}'`;
		db.query(sql, function (err) {
			db.release();
			if(err){
				console.log(language.errorUpdateOnlineTime);
				return
			}
		});
		if(err){
			console.log(language.errorDataBaseConnectionFailed,err);
			return
		}
	});
}

function getTempoOnline (id,tempoOnline) {
	dbpool.getConnection((err, db) => {
		var sql= `SELECT tempoOnline,daysOnline FROM utente where idutente='${id}'`;	
		db.query(sql, function (err,result) {
			db.release();
			if(err){
				console.log(language.errorGetOnlineTime);
				return
			}
			else{
				if (result.length!==0) {
					return tempoOnline(result[0].tempoOnline,result[0].daysOnline);
				}
			}
		});
		
		if(err){
			console.log(language.errorDataBaseConnectionFailed);
			return
		}
	});
}
exports.getTempoOnline = getTempoOnline;

function getTempoOnlineSeconds (id,tempoOnline) {
	dbpool.getConnection((err, db) => {
		var sql= `SELECT TIME_TO_SEC(tempoOnline) as time,daysOnline FROM utente where idutente='${id} '`;	
		db.query(sql, function (err,result) {
			db.release();
			if(err){
				console.log(language.errorGetOnlineTime);
				return
			}
			else{
				if (result.length!==0) {
					return tempoOnline(result[0].time,result[0].daysOnline);
				}
			}
		});
		
		if(err){
			console.log(language.errorDataBaseConnectionFailed);
			return
		}
	});
}
exports.getTempoOnlineSeconds = getTempoOnlineSeconds;

function getSaldoGiocatore (id,saldo) {
	dbpool.getConnection((err, db) => {
		var sql= `SELECT saldo FROM utente where idutente='${id}'`;	
		db.query(sql, function (err,result) {
			db.release();
			if(err){
				console.log(language.errorGetCoin);
				return
			}
			else{
				if (result.length!==0) {
					return saldo(result[0].saldo);
				}
			}
		});
		
		if(err){
			console.log(language.errorDataBaseConnectionFailed);
			return
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
			message.reply(language.msgGetTime+daysOnline+" days and "+tempoOnline);
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
					
						console.log(language.dbMsgUserAlreadySigned);
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

					console.log(language.dbMsgUserCorrectlySigned);
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
exports.signIn = signIn;
function verificaSaldo(importo,saldo){
	if(importo <= saldo){
		return true;
	}
	else{
		return false;
	}
}
exports.verificaSaldo=verificaSaldo;

