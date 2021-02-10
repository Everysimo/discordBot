const {KSoftClient} = require('@ksoft/api');
const Discord = require('discord.js');
const ksoft = new KSoftClient(process.env.tokenKsoft);

exports.image= async function (message) {
    const { url } = await ksoft.images.aww();
    message.channel.reply(url);
}