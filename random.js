const KSoftClient = require('@ksoft/api');
const ksoft = new KSoftClient.KSoftClient(process.env.token_Ksoft);

exports.image= async function (message) {
    const url = await ksoft.images.aww();
    message.channel.send(url);
}