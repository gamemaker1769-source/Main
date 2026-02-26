const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "nsfwvid",
    aliases: ["hvid", "adultvideo"],
    version: "2.0",
    author: "Gemini",
    countDown: 10, // Anti-spam cooldown
    role: 0,
    category: "adult",
    guide: {
      en: "{pn} - Random adult video paben."
    }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;

    // Warning: Group e use korle age check korben nsfw allowed kina
    api.setMessageReaction("🔞", messageID, () => {}, true);

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const filePath = path.join(cacheDir, `nsfw_${Date.now()}.mp4`);

    try {
      // Stable NSFW Video API
      const res = await axios.get("https://api.vyturex.com/nsfw");
      const videoUrl = res.data.video;

      if (!videoUrl) {
        return api.sendMessage("❌ API theke kono video paowa jayni. Abar try korun.", threadID, messageID);
      }

      const response = await axios({
        method: 'get',
        url: videoUrl,
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        // File size check (Messenger 25MB limit)
        const stats = fs.statSync(filePath);
        if (stats.size > 26214400) {
            fs.unlinkSync(filePath);
            return api.sendMessage("⚠️ Video size khub boro (25MB+), tai pathano gelo na.", threadID, messageID);
        }

        api.sendMessage({
          body: "🔞 Request kora video-ti niche dewa holo:",
          attachment: fs.createReadStream(filePath)
        }, threadID, () => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            api.setMessageReaction("✅", messageID, () => {}, true);
        }, messageID);
      });

      writer.on("error", (err) => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        api.sendMessage("❌ Download korte error hoyeche.", threadID, messageID);
      });

    } catch (error) {
      console.error(error);
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage("⚠️ API Server down. Shana ba onno API try korun.", threadID, messageID);
    }
  }
};
