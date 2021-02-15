const Discord = require('discord.js');
const config = require('./config.json');
const language =require('./language/'+config.language+'/user.json');
const bot = require('./bot');

async function addCoin(){ 
	const guild = bot.client.guilds.cache.array();
	for (let i = 0; i < guild.length; i++) {
		const element = guild[i];
		const activeMember= await guild.members.cache.filter(member=>member.voice.channel!==null).array();
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
		var activeMember= await element.members.cache.filter(member=>member.voice.channel!==null).array();
		var newActiveMember=new Array();
		getUsersSignedIn(users=>{
			console.log("user:"+users);
			for(let y=0;y<activeMember.length;y++){
				newActiveMember.push(activeMember.filter(member=>member.id===users[y].idutente));
			}
		});
		for (let index = 0; index < newActiveMember.length; index++) {
			var id = newActiveMember[index].id;
			applyAddTime(id)
		}
	}
	
}
exports.addTime = addTime;

function applyAddTime(id){
	getTempoOnlineSeconds(id,function(tempoOnline,daysOnline){
		
		tempoOnline+=1;
		if(tempoOnline>=86400){
			daysOnline++;
			tempoOnline-=86400;
		}

		aggiornaTempoOnline(tempoOnline,daysOnline,id);
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

function aggiornaTempoOnline(nuovoTempo,newDays,id){
		var sql= `Update utente set tempoOnline=SEC_TO_TIME('${nuovoTempo}'),daysOnline=('${newDays}') where idutente='${id}'`;
		dbpool.query(sql, function (err) {
			if(err){
				console.log(language.errorUpdateOnlineTime,err);
				return
			}
		});
}

function getTempoOnline (id,tempoOnline) {
		var sql= `SELECT tempoOnline,daysOnline FROM utente where idutente='${id}'`;	
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

function getTempoOnlineSeconds (id,tempoOnline) {
	
		var sql= `SELECT TIME_TO_SEC(tempoOnline) as time,daysOnline FROM utente where idutente='${id} '`;	
		dbpool.query(sql, function (err,result) {
			if(err){
				console.log(language.errorGetOnlineTime,err);
				return
			}
			else{
				if (result.length!==0) {
					return tempoOnline(result[0].time,result[0].daysOnline);
				}else{
					console.log("no db id:"+id);
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

function getUsersSignedIn(users){
	var sql= `SELECT idutente FROM utente`;	
		dbpool.query(sql, function (err,result) {
			if(err){
				console.log(language.errorGetCoin,err);
				return
			}
			else{
				if (result.length!==0) {
					return users(result);
				}
			}
		});
}
exports.getUsersSignedIn = getUsersSignedIn;