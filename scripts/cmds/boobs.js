const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const types = {
  boobs: "https://nekobot.xyz/api/image?type=boobs",
  ass: "https://nekobot.xyz/api/image?type=ass",
  thighs: "https://nekobot.xyz/api/image?type=thigh",
  hentai: "https://nekobot.xyz/api/image?type=hentai",
  pgif: "https://nekobot.xyz/api/image?type=pgif",
  waifu: "https://nekobot.xyz/api/image?type=waifu",
  animegirl: "https://nekos.life/api/v2/img/neko"
};

module.exports = {
  config: {
    name: "boobs",
    version: "2.0",
    author: "ChatGPT Modified",
    description: "Send random girl/beauty images",
    usage: "boobs boobs/ass/waifu/thighs/hentai/pgif/animegirl",
    cooldown: 5,
    permissions: 0,
    category: "18+"
  },

  onStart: async function({ api, event, args }) {
    const type = args[0]?.toLowerCase();
    if (!type || !types[type]) {
      return api.sendMessage(
        "❌ Please specify a valid type: boobs, ass, thighs, hentai, pgif, waifu, animegirl.",
        event.threadID,
        event.messageID
      );
    }

    const cachePath = path.join(__dirname, "cache");
    if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);

    const imgPath = path.join(cachePath, `${Date.now()}.jpg`);

    try {
      const apiURL = types[type];
      const response = await axios.get(apiURL);
      const imageUrl = response.data.message || response.data.url;

      const imgData = (await axios.get(imageUrl, { responseType: 'arraybuffer' })).data;
      fs.writeFileSync(imgPath, imgData);

      await api.sendMessage({
        body: `Here's your ${type} image!`,
        attachment: fs.createReadStream(imgPath)
      }, event.threadID, () => fs.unlinkSync(imgPath), event.messageID);

    } catch (err) {
      console.error(err);
      api.sendMessage(
        "❌ Couldn't fetch the image right now, please try again later.",
        event.threadID,
        event.messageID
      );
    }
  }
};