const {KSoftClient} = require('@ksoft/api');
const ksoft = new KSoftClient(process.env.tokenKsoft);

exports.image= async function (message) {
    const { url } = await ksoft.images.aww();
    message.channel.send(url);
}