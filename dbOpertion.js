const mysql = require('mysql');
const config = require('./config.json');
const lingua =require(config.lingua);
const fs = require('fs');

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

exports.saldoGiocatore = function (id,saldo) {
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

exports.aggiornaSaldo = function (nuovoSaldo,id){ 
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

exports.createPlayListDB = function (id, nome){
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