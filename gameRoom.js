const Discord = require('discord.js');
const config = require('./config.json');
const language =require('./language/'+config.language+'/gameRoom.json');
const db=require("./dbOpertion.js");
const bot = require('./bot');

//lancio moneta testa o croce
exports.coinflip = function (message){
	const m=message.content.split(" ")[1];
	const id=message.member.user.id;
	db.saldoGiocatore(id,function(saldo){
		var importo=parseInt(message.content.split(" ")[2]);
		if (!isNaN(importo) && importo > 0) {
			if (verificaSaldo(importo,saldo)) {
				var testa;
				var win;
				const risultato = new Discord.MessageEmbed();
				risultato.setTitle('coin flip');
				switch (Math.floor(Math.random() * 2)) {
					case 0:
						testa=true;
						risultato.setImage("https://upload.wikimedia.org/wikipedia/it/d/de/1_%E2%82%AC_Italia.jpg");
						break;
					case 1:
						testa=false;
						risultato.setImage("https://upload.wikimedia.org/wikipedia/it/0/06/1_%E2%82%AC_2007.jpg");
						break;
				}
				if(m===language.head||m===language.h){
					if (testa) {
						win=true;
					}else{
						win=false;
					}
				}else if(m===language.tail||m===language.t){
					if (testa) {
						win=false;
					}else{
						win=true;
					}
				}else{
					message.reply(language.notSelect);
					return;
				}
				if (win) {
					db.aggiornaSaldo(saldo+(importo*2),id);
					risultato.addFields(
						{ name: language.win, value: importo*2+' '+config.coinName },
					);
					risultato.setColor("#00ff37");
				}else{
					db.aggiornaSaldo(saldo-importo,id);
					risultato.addFields(
						{ name: language.lose, value: importo+' '+config.coinName },
					);
					risultato.setColor("#f50505");
				}
				message.channel.send(risultato);
			}else{
				message.reply(language.msgNotEnoughCoin);
			}
		}else{
			message.reply(language.errorAmountNotValid);
		}
	});

}

//genera una slot 
exports.slot = function (message){
	const id=message.member.user.id;
	db.saldoGiocatore(id,function(saldo){
		var importo=parseInt(message.content.split(" ")[1]);
		if (!isNaN(importo) && importo > 0) {
			if (verificaSaldo(importo,saldo)) {
				const slotList=new Array();
				for (let index = 0; index < config.slotItem.length; index++) {
					slotList.push(Math.floor(Math.random() * config.slotItem.length));
				}
				const elementoIniziale=slotList[0];
				var vinto=true;
				slotList.forEach(element => {
					if (!(elementoIniziale===element)) {
						vinto=false;
					}
				});
				const risultato = new Discord.MessageEmbed()
				risultato.setTitle('Slot Machine');
				for (let index = 0; index < slotList.length; index++) {
					risultato.addFields(
						{ name: 'Slot '+index, value: config.slotItem[slotList[index]] , inline: true },
					);
				}
				if (vinto) {
					var jackpot=false;
					var moltiplicatore = config.multiplier;
					if (Math.floor(Math.random()*10)==1) {
						jackpot=true;
						moltiplicatore=config.multiplierJackpot;
					}
					if(!jackpot){
						db.aggiornaSaldo(saldo+(importo*moltiplicatore),id);
						risultato.addFields(
							{ name: message.member.user.username +" "+ language.win, value: importo*moltiplicatore+' '+config.coinName },
						);
						risultato.setColor("#00ff37");
					}
					else{
						db.aggiornaSaldo(saldo+(importo*moltiplicatore),id);
						risultato.addFields(
							{ name: message.member.user.username +" "+ language.winJackpot, value: importo*moltiplicatore+' '+config.coinName },
						);
						risultato.setColor("#00ff37");
					}
				}else{
					db.aggiornaSaldo(saldo-importo,id);
					risultato.addFields(
						{ name: message.member.user.username +" "+ language.lose, value: importo+' '+config.coinName },
					);
					risultato.setColor("#f50505");
				}
				message.channel.send(risultato);
			}else{
				message.reply(language.msgNotEnoughCoin);
			}
		}else{
			message.reply(language.errorAmountNotValid);
		}
	});	
}

//giro di roulette
exports.roulette = function (message){
	if(!message.member.user.bot){
	const giocata=message.content.split(" ")[1];
	const id=message.member.user.id;
	db.saldoGiocatore(id,function(saldo){
		var importo=parseInt(message.content.split(" ")[2]);
		if (!isNaN(importo) && importo > 0) {
			if (verificaSaldo(importo,saldo)) {
				const numeriRossi = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
				const numeriNeri =[2,4,6,8,10,11,13,15,17,20,22,24,26,28,28,31,33,35];
				const risultato = new Discord.MessageEmbed();
				const gioco = new Discord.MessageEmbed();

				gioco.setImage("https://i.imgur.com/YJu1Ced.gif");
				//calcolo numero risultato
				const resultNumeber = Math.floor(Math.random() * 36);
				if(numeriRossi.includes(resultNumeber)){
					gioco.addFields(
						{ name: language.luckyNumber, value: resultNumeber +language.red},
					);
				}
				if(numeriNeri.includes(resultNumeber)){
					gioco.addFields(
						{ name: language.luckyNumber, value: resultNumeber + language.black },
					);
				}
				if(resultNumeber===0){
					gioco.addFields(
						{ name: language.luckyNumber, value: resultNumeber + language.green},
					);
				}

				message.channel.send(gioco);
				
				//giocata colore rosso
				if(giocata === language.red ||giocata === language.r){
					if(numeriRossi.includes(resultNumeber)){
						db.aggiornaSaldo(saldo+(importo*3),id);
						risultato.addFields(
							{ name: language.win, value: importo*3+' '+config.coinName },
						);
						risultato.setColor("#00ff37");
					}
					else{
						db.aggiornaSaldo(saldo-importo,id);
					risultato.addFields(
						{ name: language.lose, value: importo+' '+config.coinName },
					);
					risultato.setColor("#f50505");
				}
				message.channel.send(risultato);
				return
				}

				//giocata colore nero
				if(giocata === language.black||giocata === language.b){
					if(numeriNeri.includes(resultNumeber)){
						db.aggiornaSaldo(saldo+(importo*3),id);
						risultato.addFields(
							{ name: language.win, value: importo*3+' '+config.coinName },
						);
						risultato.setColor("#00ff37");
					}
						else{
							db.aggiornaSaldo(saldo-importo,id);
							risultato.addFields(
							{ name: language.lose, value: importo+' '+config.coinName },
						);
						risultato.setColor("#f50505");
					}
				message.channel.send(risultato);
				return
				}

				//giocata pari
				if(giocata === language.odd ||giocata === language.o){
					if(resultNumeber%2==0 && resultNumeber !=0){
						db.aggiornaSaldo(saldo+(importo*3),id);
						risultato.addFields(
							{ name: language.win, value: importo*3+' '+config.coinName },
						);
						risultato.setColor("#00ff37");
					}
						else{
							db.aggiornaSaldo(saldo-importo,id);
							risultato.addFields(
							{ name: language.lose, value: importo+' '+config.coinName },
						);
						risultato.setColor("#f50505");
					}
				message.channel.send(risultato);
				return
				}

				//giocata dispari
				if(giocata === language.even ||giocata === language.e){
					if(resultNumeber%2!=0 && resultNumeber !=0){
						db.aggiornaSaldo(saldo+(importo*3),id);
						risultato.addFields(
							{ name: language.win, value: importo*3+' '+config.coinName },
						);
						risultato.setColor("#00ff37");
					}
						else{
							db.aggiornaSaldo(saldo-importo,id);
							risultato.addFields(
							{ name: language.lose, value: importo+' '+config.coinName },
						);
						risultato.setColor("#f50505");
					}
				message.channel.send(risultato);
				return
				}

				//conversione in intero della giocata
				var intGiocata = parseInt(giocata);
				//se è un numero valido
				if(!isNaN(intGiocata)){
					//se numero giocato = risultato
					if(intGiocata === resultNumeber){
							//se 0 vincita X50
							if(resultNumeber===0){
								db.aggiornaSaldo(saldo+(importo*49),id);
								risultato.addFields(
									{ name: language.win, value: importo*40+' '+config.coinName },
								);
								risultato.setColor("#00ff37");
							}
							//ALTRO NUMERO X36
							else{
								db.aggiornaSaldo(saldo+(importo*35),id);
								risultato.addFields(
								{ name: language.win, value: importo*35+' '+config.coinName },
								);
								risultato.setColor("#00ff37");ù
							}
						}
					//se NUMERO NO UGUALE PERDITA
					else{
						db.aggiornaSaldo(saldo-importo,id);
						risultato.addFields(
						{ name: language.lose, value: importo+' '+config.coinName },
					);
					risultato.setColor("#f50505");
					}
					message.channel.send(risultato);
					return
				}
				else{
					message.reply(language.errorPlayed);
					return
				}
			}
		}else{
			message.reply(language.errorAmountNotValid);
		}
	});
	}
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

function estrai(numeriEstrare,maxNumero) {
	var numeriVincenti=new Array();
	var i=0;
	while (i<numeriEstrare) {
		let nEstratto=Math.floor(Math.random()*(maxNumero-1))+1
		if (numeriVincenti.indexOf(nEstratto)==-1) {
			numeriVincenti.push(nEstratto);
			i++;
		}
	}
	numeriVincenti.sort(function(a, b){return a - b});
	return numeriVincenti;
}
exports.estrai=estrai;

exports.buyBiglietto = function(message){
	const id=message.member.user.id;
	var numeri= estrai(6,90);
	db.creaBiglietto(id,numeri);
	message.reply(language.msgYourNumbers+numeri.toString())
	//TODO messaggio se non hai abbastanza coin
}

function valutaVincita(element,numeriVincente){
	var esatti=0;
	if (numeriVincente.includes(element.numero1)) {
		esatti=esatti+1;
	}
	if (numeriVincente.includes(element.numero2)) {
		esatti=esatti+1;
	}
	if (numeriVincente.includes(element.numero3)) {
		esatti=esatti+1;
	}
	if (numeriVincente.includes(element.numero4)) {
		esatti=esatti+1;
	}
	if (numeriVincente.includes(element.numero5)) {
		esatti=esatti+1;
	}
	if (numeriVincente.includes(element.numero6)) {
		esatti=esatti+1;
	}
	return esatti;
}

exports.calcolaVincita=function() {
	var numeriVincente=estrai(6,90);
	stampanumeriVincenti(numeriVincente);
	var vincitore=new Array();
	var vincitoreCon5=new Array();
	db.ottieniBiglietti(result=>{
		result.forEach(element=>{
			var esatti=valutaVincita(element,numeriVincente);
			if (esatti===6) {
				vincitore.push(element.user);
			}else if(esatti===5){
				vincitoreCon5.push(element.user);
			}
		})
		var vincitaTotale=Math.floor((result.length*config.lotteryTicket)/2);
		var vincitaSingola=Math.floor(vincitaTotale/(vincitore.length+vincitoreCon5.length));
		var vincitaSingolacon5=Math.floor(vincitaSingola/1.5);

		for (let index = 0; index < vincitore.length; index++) {
			const element = vincitore[index];
			stampaVincita(element,vincitaSingola)
		}

		for (let index = 0; index < vincitoreCon5.length; index++) {
			const element = vincitoreCon5[index];
			stampaVincita(element,vincitaSingolacon5);
		}
	});
}
function stampanumeriVincenti(numeriVincenti){
	const resultWinningNumbers = new Discord.MessageEmbed();

	resultWinningNumbers.setTitle(language.winningNumbers);
	resultWinningNumbers.addFields(
		{ name: "numeri vincenti", value: numeriVincenti, inline:true},
	);
	const channel=bot.client.channels.cache.get(config.lotteryChannel);
	channel.send(resultWinningNumbers);
	//TO-DO inviare messaggio
}

function stampaVincita(id,vincita){
	try{
		db.saldoGiocatore(id,saldo=>{
			db.aggiornaSaldo(saldo+(vincita),id);
		});
	}
	catch(err){
		console.log("errore nell'aggioranre il saldo",err.stack)
	}

	const resultWin = new Discord.MessageEmbed();
	const user = bot.client.users.cache.get(id);
	resultWin.setTitle(language.winnigNumbers);
	resultWin.addFields(
		{ name: language.win +" "+ vincita,value: user.username, inline:true},
	);
	const channel=bot.client.channels.cache.get(config.lotteryChannel);
	channel.send(resultWin);
	//TO-DO inviare messaggio
}