const mysql = require('mysql');

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
	    	throw new Error("Errore durante la connessione al database");
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
				console.log("errore nel caricamento del tuo saldo",err);
				return
			}
			else{
				return saldo(result[0].saldo);
			}
		});
		
		if(err){
			console.log(err.message);
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
				console.log("errore durante l'aggiornamento del saldo",err);
				return
			}
		});
		if(err){
			console.log(err.message);
			return
		}
	});
}

exports.cretePlayListDB = function (id, nome){
	dbpool.getConnection((err, db) => {
		var sql= `Insert Into playlist (nome,utente) Values ('${nome}','${id}')`;
		db.query(sql, function (err) {
			db.release();
			if(err.code.match('ER_DUP_ENTRY')){
				throw err;
			}
			if(err){
				console.log("errore durante l'inserimento di una nuova playlist",err);
				return
			}
			
		});
		if(err){
			console.log(err.message);
			return
		}
	});
}

exports.removeSongFromPlBD = function (id, url, nomePlaylist){
	dbpool.getConnection((err, db) => {
		var sql= `remove from contenuto where  ('${url}','${id}',${nomePlaylist}')`;
		db.query(sql, function (err) {
			db.release();
			if(err){
				console.log("errore durante l'aliminazione della canzone",err);
				return
			}
		});
		if(err){
			console.log(err.message);
			return
		}
	});
}

exports.addSong = function (id, url, nomePlaylist){
	dbpool.getConnection((err, db) => {
		var sql= `Insert Into song Values ('${url}')`;
		db.query(sql, function (err) {
			
			if(err.code.match('ER_DUP_ENTRY')){
				sql= `Insert Into contenuto Values ('${url}','${id}','${nomePlaylist}')`;
				db.query(sql, function (err) {
					db.release();
					if(err.code.match('ER_DUP_ENTRY')){
						throw err;
					}
					if(err){
						console.log("errore durante aggiunzione di una canzone alla playlist",err);
						return
					}
				});
			}
			if(err){
				console.log("errore durante aggiunzione di una canzone",err);
				return
			}
		});
		if(err){
			console.log(err.message);
			return
		}
		sql= `Insert Into contenuto Values ('${url}','${id}','${nomePlaylist}')`;
		db.query(sql, function (err) {
			db.release();
			if(err.code.match('ER_DUP_ENTRY')){
				throw err;
			}
			if(err){
				console.log("errore durante aggiunzione di una canzone alla playlist",err);
				return
			}
		});
		if(err){
			console.log(err.message);
			return
		}
	});
}