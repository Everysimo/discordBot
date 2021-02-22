const Trello = require("trello");
var trello=new Trello(process.env.trelloKey,process.env.trelloToken);

function addSuggestion(message) {
    var titolo="by: "+message.member.user.id;
    var descrizione=message.content.substr(message.content.indexOf(" "));
    trello.addCard(titolo,descrizione,"602fffe7f6c57a0f8f77bc02",error=>{
        if (error) {
            console.log(error);
        }
    })
    message.reply("grazie per il suggerimento")
}
exports.addSuggestion = addSuggestion;