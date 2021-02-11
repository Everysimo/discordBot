const Discord = require('discord.js');
const config = require('./config.json');
const language =require('./language/'+config.language+'/user.json');
const bot = require('./bot');

async function addCoin(){ 
	const guild = bot.client.guilds.cache.get(config.IdServer);
	const activeMember= await guild.members.cache.filter(member=>member.voice.channel!==null).array();
    console.log("provo ad aggiungere soldini");
	for (let index = 0; index < activeMember.length; index++) {
		var element = activeMember[index];
        var id = element.id;
        
        console.log("sto aggiungendo soldini a "+id);
		try{
			getSaldoGiocatore(id,async saldo=>{
				await aggiornaSaldo(saldo+(config.coinForTime),id);
			});
		}
		catch(err){
			console.log("errore nell'aggioranre il saldo",err.stack)
		}
	}
}
exports.addCoin = addCoin;

async function aggiornaSaldo(nuovoSaldo,id){ 
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
				if (result.length===0) {
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

function getSaldo(message){
	if(!message.member.user.bot){
		const id=message.member.user.id;
		getSaldoGiocatore(id,function(saldo){
			message.reply(language.msgGetCoin+saldo+" "+config.coinName);
		});
	}
}
exports.getSaldo = getSaldo;
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