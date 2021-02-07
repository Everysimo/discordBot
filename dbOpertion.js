const mysql = require('mysql');
const config = require('./config.json');
const lingua =require(config.lingua);
const gameRoom=require("./gameRoom.js")
exports.dbConnect = function () {
    //creazione pool di connessione al DataBase
    const dbpool = mysql.createPool({
	    host: process.env.host,
	    user: process.env.user,
	    password: process.env.password,
	    database: process.env.database,
	    port: 3306,
    });
    global.dbpool = dbpool;

    //ottenere connessione dall pool ed eseguire connessione
    dbpool.getConnection(function(err){
	    if (err) {
	    	console.log(err.stack);
	    	throw new Error(lingua.errorDataBaseConnectionFailed);
	    }
	    console.log("Database connesso!");
    });
}

function saldoGiocatore (id,saldo) {
	dbpool.getConnection((err, db) => {
		var sql= `SELECT saldo FROM utente where idutente='${id}'`;	
		db.query(sql, function (err,result) {
			db.release();
			if(err){
				console.log("errore nel caricamento del tuo saldo");
				return
			}
			else{
				return saldo(result[0].saldo);
			}
		});
		
		if(err){
			console.log(lingua.errorDataBaseConnectionFailed);
			return
		}
	});
}
exports.saldoGiocatore = saldoGiocatore;

function aggiornaSaldo(nuovoSaldo,id){ 
	dbpool.getConnection((err, db) => {
		var sql= `Update utente set saldo='${nuovoSaldo}' where idutente='${id}'`;
		db.query(sql, function (err) {
			db.release();
			if(err){
				console.log("errore durante l'aggiornamento del saldo");
				return
			}
		});
		if(err){
			console.log(lingua.errorDataBaseConnectionFailed,err);
			return
		}
	});
}
exports.aggiornaSaldo =aggiornaSaldo;

exports.createPlayListDB = function (id, nome){
	controlloNPL(id,risultato=>{
		if (risultato) {
			dbpool.getConnection((err, db) => {

				var sql= `Insert Into playlist (nome,utente) Values ('${nome}','${id}')`;
				db.query(sql, function (err) {
					db.release();
					
					if(err){
						if(err.code.match('ER_DUP_ENTRY')){
							console.log("PlayList già esistente");
						}
						else{
							console.log("errore durante l'inserimento di una nuova playlist");
							return
						}
					}
					
				});
				if(err){
					console.log(lingua.errorDataBaseConnectionFailed,err);
					return
				}
			});
		}
	});
}

exports.removeSongFromPlBD = function (id, url, nomePlaylist){
	dbpool.getConnection((err, db) => {

		var sql= `delete from contenuto where song='${url}' and playlist_utente='${id}' and playlist_nome='${nomePlaylist}'`;
		db.query(sql, function (err) {
			db.release();
			if(err){
				console.log("errore durante l'eliminazione della canzone");
				return
			}
		});
		if(err){
			console.log(lingua.errorDataBaseConnectionFailed,err);
			return
		}
	});
}

exports.addSong = function (id, url, nomePlaylist){
	controlloNSong(id,nomePlaylist,risultato=>{
		if(risultato){
			dbpool.getConnection((err, db) => {
				var sql= `Insert Into song Values ('${url}')`;
				db.query(sql, function (err) {
					if(err){
						if(err.code.match('ER_DUP_ENTRY')){
							sql= `Insert Into contenuto Values ('${url}','${id}','${nomePlaylist}')`;
							db.query(sql, function (err) {
								if(err){
									if(err.code.match('ER_DUP_ENTRY')){
										console.log("Canzone già presente nel database");
										return
									}
									else{
										console.log("errore durante aggiunzione di una canzone alla playlist\n");
										return
									}
								}
							});
						}
						else{
							console.log("errore durante aggiunzione di una canzone");
							return
						}
						
					}
				});
				sql= `Insert Into contenuto Values ('${url}','${id}','${nomePlaylist}')`;
				db.query(sql, function (err) {
					db.release();
		
					if(err){
						if(err.code.match('ER_DUP_ENTRY')){
							console.log("Canzone già presente nella PlayList");
							return
						}
						else{
							console.log("errore durante aggiunzione di una canzone alla playlist");
							return
						}
					}
				});
				if(err){
					console.log(lingua.errorDataBaseConnectionFailed,err);
					return
				}
			});
		}
	});
}
exports.leggiPL = function (id,nomePlaylist,risultato){
	dbpool.getConnection((err, db) => {
		var sql= `SELECT song FROM contenuto where playlist_utente='${id}' and playlist_nome='${nomePlaylist}'`;	
		db.query(sql, function (err,result) {
			db.release();
			if(err){
				console.log("errore nella lettura della playlist");
				return
			}
			else{
				return risultato(result);
			}
		});
		
		if(err){
			console.log(lingua.errorDataBaseConnectionFailed,err);
			return
		}
	});
}

function controlloNPL(id,risultato) {
	dbpool.getConnection((err, db) => {
		var sql= `SELECT maxPlaylist FROM utente where idutente='${id}'`;	
		db.query(sql, function (err,result) {
			db.release();
			if(err){
				console.log("errore nella lettura dell utente");
				return
			}
			else{
				dbpool.getConnection((err, db) => {
					var sql= `SELECT count(*) as nPlaylist FROM playlist where utente='${id}'`;	
					db.query(sql, function (err,result1) {
						db.release();
						if(err){
							console.log("errore nella lettura della playlist");
							return
						}
						else{
							return risultato(result1[0].nPlaylist<result[0].maxPlaylist);
						}
					});
					
					if(err){
						console.log(lingua.errorDataBaseConnectionFailed,err);
						return
					}
				});
			}
		});
		if(err){
			console.log(lingua.errorDataBaseConnectionFailed,err);
			return
		}
	});
}

function controlloNSong(id,nomePlaylist,risultato) {
	dbpool.getConnection((err, db) => {
		var sql= `SELECT maxCanzoni FROM playlist where utente='${id}' and nome='${nomePlaylist}'`;	
		db.query(sql, function (err,result) {
			db.release();
			if(err){
				console.log("errore nella lettura della playlist");
				return
			}
			else{
				dbpool.getConnection((err, db) => {
					var sql= `SELECT count(*) as nSong FROM contenuto where playlist_utente='${id}' and playlist_nome='${nomePlaylist}'`;	
					db.query(sql, function (err,result1) {
						db.release();
						if(err){
							console.log("errore nella lettura del contenuto della playlist");
							return
						}
						else{
							return risultato(result1[0].nSong<result[0].maxCanzoni);
						}
					});
					
					if(err){
						console.log(lingua.errorDataBaseConnectionFailed,err);
						return
					}
				});
			}
		});
		
		if(err){
			console.log(lingua.errorDataBaseConnectionFailed,err);
			return
		}
	});
}

exports.addnPL=function(n,id){
	saldoGiocatore(id,saldo=>{
		if(gameRoom.verificaSaldo(config.coinPL*n,saldo)){
			dbpool.getConnection((err, db) => {
				var sql= `SELECT maxPlaylist FROM utente where idutente='${id}'`;	
				db.query(sql, function (err,result) {
					db.release();
					if(err){
						console.log("errore nella lettura dell utente");
						return
					}
					else{
						var n1=result[0].maxPlaylist+n;
						dbpool.getConnection((err, db) => {
							var sql= `Update utente set maxPlaylist='${n1}' where idutente='${id}'`;
							db.query(sql, function (err) {
								db.release();
								if(err){
									console.log("errore durante l'aggiornamento del numero max di playlist");
									return
								}else{
									aggiornaSaldo(saldo-(config.coinPL*n),id);
								}
							});
							if(err){
								console.log(lingua.errorDataBaseConnectionFailed,err);
								return
							}
						});
					}
				});
				if(err){
					console.log(lingua.errorDataBaseConnectionFailed,err);
					return
				}
			});
		}
	});
}

exports.addnSong=function(n,id,nomePlaylist){
	saldoGiocatore(id,saldo=>{
		if(gameRoom.verificaSaldo(config.coinSong*n,saldo)){
			dbpool.getConnection((err, db) => {
				var sql= `SELECT maxCanzoni FROM playlist where utente='${id}' and nome='${nomePlaylist}'`;	
				db.query(sql, function (err,result) {
					db.release();
					if(err){
						console.log("errore nella lettura dell playlist");
						return
					}
					else{
						var n1=result[0].maxCanzoni+n;
						dbpool.getConnection((err, db) => {
							var sql= `Update playlist set maxCanzoni=${n1} where utente='${id}' and nome='${nomePlaylist}'`;
							db.query(sql, function (err) {
								db.release();
								if(err){
									console.log("errore durante l'aggiornamento del numero max di playlist");
									return
								}else{
									aggiornaSaldo(saldo-(config.coinSong*n),id);
								}
							});
							if(err){
								console.log(lingua.errorDataBaseConnectionFailed,err);
								return
							}
						});
					}
				});
				if(err){
					console.log(lingua.errorDataBaseConnectionFailed,err);
					return
				}
			});
		}
	});
}

exports.creaBiglietto = function (id,numeri) {
	saldoGiocatore(id,saldo=>{
		if(gameRoom.verificaSaldo(config.coinBiglietto,saldo)){
			dbpool.getConnection((err, db) => {

				var sql= `Insert Into bigliettolotteria (user,numero1,numero2,numero3,numero4,numero5,numero6) Values ('${id}','${numeri[0]}',${numeri[1]},${numeri[2]},${numeri[3]},${numeri[4]},${numeri[5]})`;
				db.query(sql, function (err) {
					db.release();
					
					if(err){
						if(err.code.match('ER_DUP_ENTRY')){
							console.log("PlayList già esistente");
						}
						else{
							console.log("errore durante l'inserimento di una nuova playlist");
							return
						}
					}else{
						aggiornaSaldo(saldo-(config.coinBiglietto),id);
					}
				});
				if(err){
					console.log(lingua.errorDataBaseConnectionFailed,err);
					return
				}
			});
		}
	});
}

exports.ottieniBiglietti = function (result) {
	
}