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