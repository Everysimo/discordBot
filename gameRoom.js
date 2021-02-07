const Discord = require('discord.js');
const config = require('./config.json');
const lingua =require(config.lingua);
const db=require("./dbOpertion.js");
const bot = require('./bot');
const { match } = require('ffmpeg-static');

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
				if(m==="testa"||m==="t"){
					if (testa) {
						win=true;
					}else{
						win=false;
					}
				}else if(m==="croce"||m==="c"){
					if (testa) {
						win=false;
					}else{
						win=true;
					}
				}else{
					message.reply(lingua.notSelect);
					return;
				}
				if (win) {
					db.aggiornaSaldo(saldo+(importo*2),id);
					risultato.addFields(
						{ name: lingua.win, value: importo*2+' coin' },
					);
					risultato.setColor("#00ff37");
				}else{
					db.aggiornaSaldo(saldo-importo,id);
					risultato.addFields(
						{ name: lingua.lose, value: importo+' coin' },
					);
					risultato.setColor("#f50505");
				}
				message.channel.send(risultato);
			}else{
				message.reply("non hai abbastanza coin");
			}
		}else{
			message.reply(lingua.errorAmountNotValid);
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
					var moltiplicatore = config.moltiplicatoreNormale;
					if (Math.floor(Math.random()*10)==1) {
						jackpot=true;
						moltiplicatore=config.moltiplicatoreJackpot;
					}
					db.aggiornaSaldo(saldo+(importo*moltiplicatore),id);
					risultato.addFields(
						{ name: message.member.user.username +" "+ lingua.win, value: importo*moltiplicatore+' coin' },
					);
					risultato.setColor("#00ff37");
				}else{
					db.aggiornaSaldo(saldo-importo,id);
					risultato.addFields(
						{ name: message.member.user.username +" "+ lingua.lose, value: importo+' coin' },
					);
					risultato.setColor("#f50505");
				}
				message.channel.send(risultato);
			}else{
				message.reply("non hai abbastanza coin");
			}
		}else{
			message.reply(lingua.errorAmountNotValid);
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
						{ name: "Numero fortunato: ", value: resultNumeber +" Rosso"},
					);
				}
				if(numeriNeri.includes(resultNumeber)){
					gioco.addFields(
						{ name: "Numero fortunato: ", value: resultNumeber + " Nero" },
					);
				}
				if(resultNumeber===0){
					gioco.addFields(
						{ name: "Numero fortunato: ", value: resultNumeber + " Verde"},
					);
				}

				message.channel.send(gioco);
				
				//giocata colore rosso
				if(giocata === "rosso" ||giocata === "r"){
					if(numeriRossi.includes(resultNumeber)){
						db.aggiornaSaldo(saldo+(importo*3),id);
						risultato.addFields(
							{ name: lingua.win, value: importo*3+' coin' },
						);
						risultato.setColor("#00ff37");
					}
					else{
						db.aggiornaSaldo(saldo-importo,id);
					risultato.addFields(
						{ name: lingua.lose, value: importo+' coin' },
					);
					risultato.setColor("#f50505");
				}
				message.channel.send(risultato);
				return
				}

				//giocata colore nero
				if(giocata === "nero" ||giocata === "n"){
					if(numeriNeri.includes(resultNumeber)){
						db.aggiornaSaldo(saldo+(importo*3),id);
						risultato.addFields(
							{ name: lingua.win, value: importo*3+' coin' },
						);
						risultato.setColor("#00ff37");
					}
						else{
							db.aggiornaSaldo(saldo-importo,id);
							risultato.addFields(
							{ name: lingua.lose, value: importo+' coin' },
						);
						risultato.setColor("#f50505");
					}
				message.channel.send(risultato);
				return
				}

				//giocata pari
				if(giocata === "pari" ||giocata === "p"){
					if(resultNumeber%2==0 && resultNumeber !=0){
						db.aggiornaSaldo(saldo+(importo*3),id);
						risultato.addFields(
							{ name: lingua.win, value: importo*3+' coin' },
						);
						risultato.setColor("#00ff37");
					}
						else{
							db.aggiornaSaldo(saldo-importo,id);
							risultato.addFields(
							{ name: lingua.lose, value: importo+' coin' },
						);
						risultato.setColor("#f50505");
					}
				message.channel.send(risultato);
				return
				}

				//giocata dispari
				if(giocata === "dispari" ||giocata === "d"){
					if(resultNumeber%2!=0 && resultNumeber !=0){
						db.aggiornaSaldo(saldo+(importo*3),id);
						risultato.addFields(
							{ name: lingua.win, value: importo*3+' coin' },
						);
						risultato.setColor("#00ff37");
					}
						else{
							db.aggiornaSaldo(saldo-importo,id);
							risultato.addFields(
							{ name: lingua.lose, value: importo+' coin' },
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
									{ name: lingua.win, value: importo*40+' coin' },
								);
								risultato.setColor("#00ff37");
							}
							//ALTRO NUMERO X36
							else{
								db.aggiornaSaldo(saldo+(importo*35),id);
								risultato.addFields(
								{ name: lingua.win, value: importo*35+' coin' },
								);
								risultato.setColor("#00ff37");ù
							}
						}
					//se NUMERO NO UGUALE PERDITA
					else{
						db.aggiornaSaldo(saldo-importo,id);
						risultato.addFields(
						{ name: lingua.lose, value: importo+' coin' },
					);
					risultato.setColor("#f50505");
					}
					message.channel.send(risultato);
					return
				}
				else{
					message.reply("giocata non esisente");
					return
				}
			}
		}else{
			message.reply(lingua.errorAmountNotValid);
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
	message.reply("i tuoi numeri sono: \n"+numeri.toString())
}

exports.valutaVincita = function(risultato){
	db.ottieniBiglietti(result=>{

	});
}

exports.stampaVincita=function() {
}