const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "gitup",
    aliases: ["upsh", "github"],
    version: "1.0",
    author: "Siam",
    shortDescription: "Advanced GitHub Manager",
    category: "owner",
    role: 2
  },

  onStart: async function ({ api, event, args }) {

    const { threadID, messageID, type, messageReply } = event;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = "gamemaker1769-source";
    const REPO_NAME = "Main";
    const BRANCH = "main";

    if (!GITHUB_TOKEN)
      return api.sendMessage("❌ GitHub token not found!", threadID, messageID);

    const headers = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "Content-Type": "application/json"
    };

    try {

      // ================= DELETE MODE =================
      if (args[0] === "delete") {

        const targetPath = args[1];
        if (!targetPath)
          return api.sendMessage("⚠️ Usage: .gitup delete path/to/file.js", threadID, messageID);

        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${targetPath}`;

        const { data } = await axios.get(url, { headers });

        await axios.delete(url, {
          headers,
          data: {
            message: `Delete via Bot: ${path.basename(targetPath)}`,
            sha: data.sha,
            branch: BRANCH
          }
        });

        return api.sendMessage(`
╔══════════════════════╗
      🗑 FILE DELETED
╚══════════════════════╝

📂 File: ${path.basename(targetPath)}
📍 Path: ${targetPath}
🌿 Branch: ${BRANCH}
🔴 Status: Successfully Removed
`, threadID, messageID);
      }
      // =================================================

      // ================= SMART PATH =================
      const autoDetectPath = (fileName) => {
        const ext = path.extname(fileName).toLowerCase();

        if (!ext) fileName += ".js";

        if (ext === ".js") return `scripts/cmds/${fileName}`;
        if (ext === ".json") return `config/${fileName}`;
        if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext)) return `assets/images/${fileName}`;
        if ([".mp4", ".mov", ".mkv"].includes(ext)) return `assets/videos/${fileName}`;
        if ([".mp3", ".wav", ".ogg"].includes(ext)) return `assets/audio/${fileName}`;
        if (ext === ".txt") return `files/${fileName}`;

        return `assets/${fileName}`;
      };
      // ===============================================

      let finalContent, githubPath;

      // ================= REPLY MODE =================
      if (type === "message_reply") {

        const attachment = messageReply.attachments[0];

        if (attachment && (attachment.type === "video" || attachment.type === "photo" || attachment.type === "audio")) {

          await api.sendMessage("⏳ Processing media...", threadID, messageID);

          const fileName = args[0] || attachment.filename || `media_${Date.now()}`;
          const getMedia = await axios.get(attachment.url, { responseType: 'arraybuffer' });

          finalContent = Buffer.from(getMedia.data).toString('base64');
          githubPath = args[0]?.includes("/") ? args[0] : autoDetectPath(fileName);
        }
        else {

          if (!messageReply.body)
            return api.sendMessage("⚠️ No text/code detected.", threadID, messageID);

          await api.sendMessage("⏳ Processing text...", threadID, messageID);

          const fileName = args[0] || `new_cmd_${Date.now()}.js`;

          finalContent = Buffer.from(messageReply.body, 'utf-8').toString('base64');
          githubPath = args[0]?.includes("/") ? args[0] : autoDetectPath(fileName);
        }
      }
      // ================= LOCAL MODE =================
      else {

        if (args.length < 1)
          return api.sendMessage("⚠️ Reply to a file or provide local file path.", threadID, messageID);

        const localPath = path.resolve(process.cwd(), args[0]);

        if (!fs.existsSync(localPath))
          return api.sendMessage(`❌ File not found: ${args[0]}`, threadID, messageID);

        const fileName = path.basename(args[0]);

        finalContent = fs.readFileSync(localPath, 'base64');
        githubPath = args[0].includes("/") ? args[0] : autoDetectPath(fileName);
      }

      // ================= UPLOAD =================
      await api.sendMessage(`🚀 Uploading...\n📂 Target: ${githubPath}`, threadID, messageID);

      const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${githubPath}`;

      let sha = "";
      let isUpdate = false;

      try {
        const { data } = await axios.get(url, { headers });
        sha = data.sha;
        isUpdate = true;
      } catch (e) {}

      await axios.put(url, {
        message: `${isUpdate ? "Update" : "New Upload"} via Bot: ${path.basename(githubPath)}`,
        content: finalContent,
        sha: sha || undefined,
        branch: BRANCH
      }, { headers });

      return api.sendMessage(`
╔══════════════════════╗
      ✅ GITHUB SUCCESS
╚══════════════════════╝

📂 File: ${path.basename(githubPath)}
📍 Path: ${githubPath}
🌿 Branch: ${BRANCH}
🔄 Type: ${isUpdate ? "Updated Existing File" : "New File Created"}
`, threadID, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage(
        `❌ Operation Failed:\n${error.response?.data?.message || error.message}`,
        threadID,
        messageID
      );
    }
  }
};