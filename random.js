const KSoftClient = require('@ksoft/api');
const ksoft = new KSoftClient.KSoftClient(process.env.tokenKsoft);

exports.image= async function (message) {
    const url = await ksoft.images.aww();
    message.reply(url.post.link);
}