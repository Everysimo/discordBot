const mysql = require('mysql');
const config = require('./config.json');
const language=require("./language.js")
const gameRoom=require("./gameRoom.js")
const server=require("./server.js")
exports.dbConnect = function () {
    //creazione pool di connessione al DataBase
    const dbpool = mysql.createPool({
		connectionLimit : 100,
		queueLimit : 0,
    	waitForConnections: true,
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
	    	throw new Error(language.langPack.ita.get("errorDataBaseConnectionFailed"));
	    }
	    console.log(language.langPack.ita.get("dbConnected"));
    });
}

exports.createPlayListDB = function (id, nome){
	controlloNPL(id,risultato=>{
		if (risultato) {
			dbpool.getConnection((err, db) => {

				var sql= `Insert Into playlist (nome,utente) Values ('${nome}','${id}')`;
				db.query(sql, function (err) {
					db.release();
					
					if(err){
						if(err.code.match('ER_DUP_ENTRY')){
							console.log(language.langPack.ita.get("playlistAlreadyExists"));
						}
						else{
							console.log(language.langPack.ita.get("errorCreatingPlayList"));
							return
						}
					}
					
				});
				if(err){
					console.log(language.langPack.ita.get("errorDataBaseConnectionFailed"),err);
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
				console.log(language.langPack.ita.get("errorDeletingSongFromPl"));
				return
			}
		});
		if(err){
			console.log(language.langPack.ita.get("errorDataBaseConnectionFailed"),err);
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
										console.log(language.langPack.ita.get("songAlreadyInDb"));
										return
									}
									else{
										console.log(language.langPack.ita.get("errorAddingSongToPl"));
										return
									}
								}
							});
						}
						else{
							console.log(language.langPack.ita.get("errorAddingSongToPl"));
							return
						}
						
					}
				});
				sql= `Insert Into contenuto Values ('${url}','${id}','${nomePlaylist}')`;
				db.query(sql, function (err) {
					db.release();
		
					if(err){
						if(err.code.match('ER_DUP_ENTRY')){
							console.log(language.langPack.ita.get("songAlreadyInPl"));
							return
						}
						else{
							console.log(language.langPack.ita.get("errorAddingSongToPl"));
							return
						}
					}
				});
				if(err){
					console.log(language.langPack.ita.get("errorDataBaseConnectionFailed"),err);
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
				console.log(language.langPack.ita.get("errorReadingPl"));
				return
			}
			else{
				return risultato(result);
			}
		});
		
		if(err){
			console.log(language.langPack.ita.get("errorDataBaseConnectionFailed"),err);
			return
		}
	});
}

exports.getPLNames= function(id,risultato){
	dbpool.getConnection((err, db) => {
		var sql= `SELECT nome,maxCanzoni FROM playlist where utente='${id}'`;	
		db.query(sql, function (err,result) {
			db.release();
			if(err){
				console.log(language.langPack.ita.get("errorReadingPl"));
				return
			}
			else{
				return risultato(result);
			}
		});
		
		if(err){
			console.log(language.langPack.ita.get("errorDataBaseConnectionFailed"),err);
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
				console.log(language.langPack.ita.get("errorReadingUser"),err);
				return
			}
			else{
				dbpool.getConnection((err, db) => {
					var sql= `SELECT count(*) as nPlaylist FROM playlist where utente='${id}'`;	
					db.query(sql, function (err,result1) {
						db.release();
						if(err){
							console.log(language.langPack.ita.get("errorReadingPl"),err);
							return
						}
						else{
							return risultato(result1[0].nPlaylist<result[0].maxPlaylist);
						}
					});
					
					if(err){
						console.log(language.langPack.ita.get("errorDataBaseConnectionFailed"),err);
						return
					}
				});
			}
		});
		if(err){
			console.log(language.langPack.ita.get("errorDataBaseConnectionFailed"),err);
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
				console.log(language.langPack.ita.get("errorReadingPl"),err);
				return
			}
			else{
				dbpool.getConnection((err, db) => {
					var sql= `SELECT count(*) as nSong FROM contenuto where playlist_utente='${id}' and playlist_nome='${nomePlaylist}'`;	
					db.query(sql, function (err,result1) {
						db.release();
						if(err){
							console.log(language.langPack.ita.get("errorReadingPlContent"),err);
							return
						}
						else{
							return risultato(result1[0].nSong<result[0].maxCanzoni);
						}
					});
					
					if(err){
						console.log(language.langPack.ita.get("errorDataBaseConnectionFailed"),err);
						return
					}
				});
			}
		});
		
		if(err){
			console.log(language.langPack.ita.get("errorDataBaseConnectionFailed"),err);
			return
		}
	});
}

exports.addnPL=function(n,id){
			dbpool.getConnection((err, db) => {
				var sql= `SELECT maxPlaylist FROM utente where idutente='${id}'`;	
				db.query(sql, function (err,result) {
					db.release();
					if(err){
						console.log(language.langPack.ita.get("errorReadingUser"),err);
						return
					}
					else{
						var n1=result[0].maxPlaylist+n;
						dbpool.getConnection((err, db) => {
							var sql= `Update utente set maxPlaylist='${n1}' where idutente='${id}'`;
							db.query(sql, function (err) {
								db.release();
								if(err){
									console.log(language.langPack.ita.get("errorUpdateMaxPlaylist"),err);
									return
								}else{
								}
							});
							if(err){
								console.log(language.langPack.ita.get("errorDataBaseConnectionFailed"),err);
								return
							}
						});
					}
				});
				if(err){
					console.log(language.langPack.ita.get("errorDataBaseConnectionFailed"),err);
					return
				}
			});
}

exports.addnSong=function(n,id,nomePlaylist){
			dbpool.getConnection((err, db) => {
				var sql= `SELECT maxCanzoni FROM playlist where utente='${id}' and nome='${nomePlaylist}'`;	
				db.query(sql, function (err,result) {
					db.release();
					if(err){
						console.log(language.langPack.ita.get("errorReadingPl"),err);
						return
					}
					else{
						var n1=result[0].maxCanzoni+n;
						dbpool.getConnection((err, db) => {
							var sql= `Update playlist set maxCanzoni=${n1} where utente='${id}' and nome='${nomePlaylist}'`;
							db.query(sql, function (err) {
								db.release();
								if(err){
									console.log(language.langPack.ita.get("errorUpdateMaxSongsPl"),err);
									return
								}
							});
							if(err){
								console.log(language.langPack.ita.get("errorDataBaseConnectionFailed"),err);
								return
							}
						});
					}
				});
				if(err){
					console.log(language.langPack.ita.get("errorDataBaseConnectionFailed"),err);
					return
				}
			});
}

exports.creaBiglietto = function (id,numeri) {
			dbpool.getConnection((err, db) => {

				var sql= `Insert Into bigliettolotteria (user,numero1,numero2,numero3,numero4,numero5,numero6) Values ('${id}','${numeri[0]}',${numeri[1]},${numeri[2]},${numeri[3]},${numeri[4]},${numeri[5]})`;
				db.query(sql, function (err) {
					db.release();
					
					if(err){
						if(err.code.match('ER_DUP_ENTRY')){
							console.log(language.langPack.ita.get("ticketAlreadyInDb"));
						}
						else{
							console.log(language.langPack.ita.get("errorAddingTicket"));
							return
						}
					}else{
					}
				});
				if(err){
					console.log(language.langPack.ita.get("errorDataBaseConnectionFailed"),err);
					return
				}
			});
}

exports.ottieniBiglietti = function (risultato) {
	dbpool.getConnection((err, db) => {
		var sql= `SELECT * FROM bigliettolotteria`;	
		db.query(sql, function (err,result) {
			db.release();
			if(err){
				console.log(language.langPack.ita.get("errorReadingTicket"),err);
				return
			}
			else{
				return risultato(result);
			}
		});
		if(err){
			console.log(language.langPack.ita.get("errorDataBaseConnectionFailed"),err);
			return
		}
	});
}
exports.inserServerInfo = function (serverInfo) {
	console.log("id server "+serverInfo.id);
	dbpool.getConnection((err, db) => {
		var sql= `Update server `+
	`SET comandibotid='${serverInfo.command}',gameroomid='${serverInfo.gameroom}',lotteryid='${serverInfo.lottery}',levelupid='${serverInfo.level}',totmemberid='${serverInfo.totalMember}',onlinememberid='${serverInfo.totalOnline}',role1id='${serverInfo.iron}',role2id='${serverInfo.bronze}',role3id='${serverInfo.silver}' ,`+
	`role4id='${serverInfo.golden}',role5id='${serverInfo.obsidian}',role6id='${serverInfo.diamond}',role7id='${serverInfo.emerald}' `+
	`WHERE idserver ='${serverInfo.id}' `
		db.query(sql, function (err) {
			db.release();
			if(err){
				if(err.code.match('ER_DUP_ENTRY')){
					console.log(language.langPack.ita.get("ticketAlreadyInDb"));
				}
				else{
					console.log(language.langPack.ita.get("errorAddingTicket"),err);
					return
				}
			}
			server.getAllServer();
			console.log("server inserito \n"+ serverInfo);
		});
		if(err){
			console.log(language.langPack.ita.get("errorDataBaseConnectionFailed"),err);
			return
		}
	});
}

exports.addServerId = function(id,result){
	dbpool.getConnection((err, db) => {
		var sql= `INSERT INTO server (idserver) VALUES ('${id}')`;
		
		db.query(sql, function (err) {
			db.release();
			if(err){
				if(err.code.match('ER_DUP_ENTRY')){			
					console.log("server già presente");
					return result(false);
				}
			}	
			else{
				console.log("server aggiunto con successo");
				return result(true);
			}
		});

		if(err){
			console.log(language.langPack.ita.get("errorDataBaseConnectionFailed"),err);
			return
		}
	});
}

exports.getAllServerDb = function (risultato) {
	dbpool.getConnection((err, db) => {
	var sql= `SELECT * FROM server`;
		
		db.query(sql, function (err,result) {
			db.release();
			if(err){
				console.log(language.langPack.ita.get("errorReadingTicket"),err);
				return
			}
			else{
				return risultato(result);
			}
		});
		if(err){
			console.log(language.langPack.ita.get("errorDataBaseConnectionFailed"),err);
			return
		}

	if(err){
		console.log(language.langPack.ita.get("errorDataBaseConnectionFailed"),err);
		return
	}
	});
}

exports.deleateAllTicket = function () {
	dbpool.getConnection((err, db) => {
	var sql= `DELETE FROM bigliettolotteria`;
		
		db.query(sql, function (err) {
			db.release();
			if(err){
				console.log(language.langPack.ita.get("errorReadingTicket"),err);
				return
			}
			else{
				return
			}
		});
		if(err){
			console.log(language.langPack.ita.get("errorDataBaseConnectionFailed"),err);
			return
		}

	if(err){
		console.log(language.langPack.ita.get("errorDataBaseConnectionFailed"),err);
		return
	}
	});
}