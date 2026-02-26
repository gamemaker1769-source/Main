const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "nsfw",
        version: "2.1",
        author: "Gemini",
        countDown: 10,
        role: 0,
        category: "adult",
        guide: { 
            en: "{pn} video - Real adult video paben.\n{pn} img - Real adult image paben." 
        }
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID, senderID } = event;
        const type = args[0]?.toLowerCase();

        if (type !== "video" && type !== "img") {
            return api.sendMessage("❌ Please specify type! Use:\n• .nsfw video (For Real Video)\n• .nsfw img (For Real Image)", threadID, messageID);
        }

        api.setMessageReaction("🔞", messageID, () => {}, true);

        // Cache folder check
        const cachePath = path.join(__dirname, "cache");
        if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);

        try {
            let apiUrl = "";
            let fileExt = "";

            if (type === "video") {
                apiUrl = "https://api.vyturex.com/nsfw"; // Real Video API
                fileExt = "mp4";
            } else {
                apiUrl = "https://api.vyturex.com/nsfwpics"; // Real Image API (Hypothetical endpoint for real pics)
                // Note: Jodi specific real pic API na thake, tobe niche 'video' response handle hobe.
                fileExt = "jpg";
            }

            const res = await axios.get(apiUrl);
            const contentUrl = res.data.video || res.data.url;

            if (!contentUrl) throw new Error("No content found");

            const fileName = `nsfw_${senderID}_${Date.now()}.${fileExt}`;
            const filePath = path.join(cachePath, fileName);

            const response = await axios({
                method: 'get',
                url: contentUrl,
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            writer.on("finish", async () => {
                const stats = fs.statSync(filePath);
                
                // Messenger limit check (25MB)
                if (stats.size > 26214400) {
                    fs.unlinkSync(filePath);
                    return api.sendMessage("⚠️ File size is too large to send.", threadID, messageID);
                }

                await api.sendMessage({
                    body: `🔞 Here is your Real NSFW ${type}`,
                    attachment: fs.createReadStream(filePath)
                }, threadID, () => {
                    fs.unlinkSync(filePath);
                    api.setMessageReaction("✅", messageID, () => {}, true);
                }, messageID);
            });

        } catch (error) {
            console.error(error);
            api.setMessageReaction("❌", messageID, () => {}, true);
            api.sendMessage("⚠️ API Server error or busy. Try again later.", threadID, messageID);
        }
    }
};
