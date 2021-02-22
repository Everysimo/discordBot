const mysql = require('mysql');
const config = require('./config.json');
const language =require('./language/'+config.language+'/dbOpertion.json');
const gameRoom=require("./gameRoom.js")
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
	    	throw new Error(language.errorDataBaseConnectionFailed);
	    }
	    console.log(language.dbConnected);
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
							console.log(language.playlistAlreadyExists);
						}
						else{
							console.log(language.errorCreatingPlayList);
							return
						}
					}
					
				});
				if(err){
					console.log(language.errorDataBaseConnectionFailed,err);
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
				console.log(language.errorDeletingSongFromPl);
				return
			}
		});
		if(err){
			console.log(language.errorDataBaseConnectionFailed,err);
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
										console.log(language.songAlreadyInDb);
										return
									}
									else{
										console.log(language.errorAddingSongToPl);
										return
									}
								}
							});
						}
						else{
							console.log(language.errorAddingSongToPl);
							return
						}
						
					}
				});
				sql= `Insert Into contenuto Values ('${url}','${id}','${nomePlaylist}')`;
				db.query(sql, function (err) {
					db.release();
		
					if(err){
						if(err.code.match('ER_DUP_ENTRY')){
							console.log(language.songAlreadyInPl);
							return
						}
						else{
							console.log(language.errorAddingSongToPl);
							return
						}
					}
				});
				if(err){
					console.log(language.errorDataBaseConnectionFailed,err);
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
				console.log(language.errorReadingPl);
				return
			}
			else{
				return risultato(result);
			}
		});
		
		if(err){
			console.log(language.errorDataBaseConnectionFailed,err);
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
				console.log(language.errorReadingPl);
				return
			}
			else{
				return risultato(result);
			}
		});
		
		if(err){
			console.log(language.errorDataBaseConnectionFailed,err);
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
				console.log(language.errorReadingUser,err);
				return
			}
			else{
				dbpool.getConnection((err, db) => {
					var sql= `SELECT count(*) as nPlaylist FROM playlist where utente='${id}'`;	
					db.query(sql, function (err,result1) {
						db.release();
						if(err){
							console.log(language.errorReadingPl,err);
							return
						}
						else{
							return risultato(result1[0].nPlaylist<result[0].maxPlaylist);
						}
					});
					
					if(err){
						console.log(language.errorDataBaseConnectionFailed,err);
						return
					}
				});
			}
		});
		if(err){
			console.log(language.errorDataBaseConnectionFailed,err);
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
				console.log(language.errorReadingPl,err);
				return
			}
			else{
				dbpool.getConnection((err, db) => {
					var sql= `SELECT count(*) as nSong FROM contenuto where playlist_utente='${id}' and playlist_nome='${nomePlaylist}'`;	
					db.query(sql, function (err,result1) {
						db.release();
						if(err){
							console.log(language.errorReadingPlContent,err);
							return
						}
						else{
							return risultato(result1[0].nSong<result[0].maxCanzoni);
						}
					});
					
					if(err){
						console.log(language.errorDataBaseConnectionFailed,err);
						return
					}
				});
			}
		});
		
		if(err){
			console.log(language.errorDataBaseConnectionFailed,err);
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
						console.log(language.errorReadingUser,err);
						return
					}
					else{
						var n1=result[0].maxPlaylist+n;
						dbpool.getConnection((err, db) => {
							var sql= `Update utente set maxPlaylist='${n1}' where idutente='${id}'`;
							db.query(sql, function (err) {
								db.release();
								if(err){
									console.log(language.errorUpdateMaxPlaylist,err);
									return
								}else{
								}
							});
							if(err){
								console.log(language.errorDataBaseConnectionFailed,err);
								return
							}
						});
					}
				});
				if(err){
					console.log(language.errorDataBaseConnectionFailed,err);
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
						console.log(language.errorReadingPl,err);
						return
					}
					else{
						var n1=result[0].maxCanzoni+n;
						dbpool.getConnection((err, db) => {
							var sql= `Update playlist set maxCanzoni=${n1} where utente='${id}' and nome='${nomePlaylist}'`;
							db.query(sql, function (err) {
								db.release();
								if(err){
									console.log(language.errorUpdateMaxSongsPl,err);
									return
								}
							});
							if(err){
								console.log(language.errorDataBaseConnectionFailed,err);
								return
							}
						});
					}
				});
				if(err){
					console.log(language.errorDataBaseConnectionFailed,err);
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
							console.log(language.ticketAlreadyInDb);
						}
						else{
							console.log(language.errorAddingTicket);
							return
						}
					}else{
					}
				});
				if(err){
					console.log(language.errorDataBaseConnectionFailed,err);
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
				console.log(language.errorReadingTicket,err);
				return
			}
			else{
				return risultato(result);
			}
		});
		if(err){
			console.log(language.errorDataBaseConnectionFailed,err);
			return
		}
	});
}
exports.inserServerInfo = function (id,serverInfo) {
	dbpool.getConnection((err, db) => {
		var sql= `Insert Into server (idserver,comandibotid,gameroomid,lotteryid,levelupid,totmemberid,onlinememberid,role1id,role2id,role3id,role4id,role5id,role6id,role7id) Values ('${id}','${serverInfo.command1}',${serverInfo.gameroom},${serverInfo.lottery},${serverInfo.level},${serverInfo.totalMember},${serverInfo.totalOnline},${serverInfo.iron},${serverInfo.bronze},${serverInfo.silver},${serverInfo.golden},${serverInfo.obsidian},${serverInfo.diamond},${serverInfo.emerald})`;
		db.query(sql, function (err) {
			db.release();
			
			if(err){
				if(err.code.match('ER_DUP_ENTRY')){
					console.log(language.ticketAlreadyInDb);
				}
				else{
					console.log(language.errorAddingTicket,err);
					return
				}
			}
		});
		if(err){
			console.log(language.errorDataBaseConnectionFailed,err);
			return
		}
	});
}