const KSoftClient = require('@ksoft/api');
const ksoft = new KSoftClient(process.env.tokenKsoft);

exports.image= async function (message) {
    const tag=message.message.content.split(" ")[1]
    const url = await ksoft.images.random(tag, { nsfw: false });
    message.channel.send(url);
}