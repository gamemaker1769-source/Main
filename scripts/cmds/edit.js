const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "edit",
    aliases: ["nanobanana"],
    version: "1.0.5",
    author: "Light⚡",
    countDown: 30,
    role: 0,
    shortDescription: "Edit image using NanoBanana API",
    category: "AI",
    guide: {
      en: "{pn} <text> (reply to an image)",
    },
  },

  onStart: async function ({ message, event, args, api }) {
    const prompt = args.join(" ");
    if (!prompt)
      return message.reply("⚠️ Please provide some text for the image.");

    api.setMessageReaction("☣️", event.messageID, () => {}, true);

    try {
      if (
        !event.messageReply ||
        !event.messageReply.attachments ||
        !event.messageReply.attachments[0] ||
        !event.messageReply.attachments[0].url
      ) {
        api.setMessageReaction("⚠️", event.messageID, () => {}, true);
        return message.reply("⚠️ Please reply to an image.");
      }

      const imgUrl = event.messageReply.attachments[0].url;

      const requestURL = `https://mahbub-ullash.cyberbot.top/api/nano-banana?prompt=${encodeURIComponent(
        prompt
      )}&imageUrl=${encodeURIComponent(imgUrl)}`;

      const res = await axios.get(requestURL);

      if (!res.data || res.data.status !== true || !res.data.image) {
        api.setMessageReaction("⚠️", event.messageID, () => {}, true);
        return message.reply("❌ API Error: Image data not received.");
      }

      const finalImageURL = res.data.image;
      const imageData = await axios.get(finalImageURL, {
        responseType: "arraybuffer",
      });

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir))
        fs.mkdirSync(cacheDir, { recursive: true });

      const filePath = path.join(cacheDir, `${Date.now()}.png`);
      fs.writeFileSync(filePath, Buffer.from(imageData.data));

      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      await message.reply(
        {
          body: `✅ Image generated successfully!\n👤 Operator: Light⚡`,
          attachment: fs.createReadStream(filePath),
        },
        () => {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {}
        }
      );
    } catch (err) {
      console.log("ERROR:", err?.response?.data || err.message || err);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("❌ Error while processing the image.");
    }
  },
};