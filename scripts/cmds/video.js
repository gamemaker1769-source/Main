const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "video",
    version: "7.0",
    author: "Light",
    role: 0,
    category: "media",
    shortDescription: "Stable video search (10 mins) with auto-retry logic",
    longDescription: "Searches for 10-minute clips. Includes auto-reconnection logic if the download fails.",
    guide: "{pn} <keyword>"
  },

  onStart: async function ({ message, args }) {
    try {
      const query = args.join(" ").trim();
      if (!query) return message.reply("⚠️ Please provide a keyword (e.g., .video hot)");

      message.reply(`⏳ Searching for "${query}" (Max 10 mins). Establishing stable connection...`);

      const searchUrl = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(query)}&per_page=15&thumbsize=large&format=json`;
      const res = await axios.get(searchUrl);
      
      const videos = res.data.videos || [];
      if (videos.length === 0) return message.reply("❌ No videos found.");

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      let attempts = 0;
      const maxSearchAttempts = 8; 

      while (attempts < maxSearchAttempts && attempts < videos.length) {
        const video = videos[attempts];
        attempts++;

        const durationParts = video.length_min.split(':');
        const durationSeconds = (parseInt(durationParts[0]) * 60) + parseInt(durationParts[1]);

        if (durationSeconds > 600) continue; 

        const title = video.title;
        const videoPageUrl = video.url;
        const videoPath = path.join(cacheDir, `vid_${Date.now()}.mp4`);

        // --- INTERNAL RETRY LOGIC FOR DOWNLOAD ---
        let downloadSuccess = false;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries && !downloadSuccess) {
          try {
            const response = await axios({
              method: "get",
              url: videoPageUrl, 
              responseType: "stream",
              timeout: 300000 
            });

            const writer = fs.createWriteStream(videoPath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
              writer.on("finish", resolve);
              writer.on("error", reject);
            });

            downloadSuccess = true;
          } catch (e) {
            retryCount++;
            if (fs.existsSync(videoPath)) fs.removeSync(videoPath);
            console.log(`Retry ${retryCount} for: ${title}`);
          }
        }

        if (!downloadSuccess) continue; 

        // --- SENDING PHASE ---
        const stats = fs.statSync(videoPath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        await message.reply({
          body: `🎬 ${title}\n⏱️ Duration: ${video.length_min}\n📦 Size: ${fileSizeMB}MB`,
          attachment: fs.createReadStream(videoPath)
        }, (err) => {
            if (err) {
                message.reply(`❌ Attachment failed (${fileSizeMB}MB). Facebook's server rejected the upload.`);
            }
            if (fs.existsSync(videoPath)) fs.removeSync(videoPath);
        });
        return; 
      }

      return message.reply("❌ All attempts to find/download a stable clip failed. Try again with a different keyword.");

    } catch (error) {
      console.error("Video Error:", error);
      message.reply("❌ Critical system error while processing video.");
    }
  }
};
