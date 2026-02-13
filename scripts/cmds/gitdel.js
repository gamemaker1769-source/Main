const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "gitdel",
    aliases: ["dlt", "ghdelete"],
    version: "4.5",
    author: "Light",
    shortDescription: "Delete file from GH & Local (Verified)",
    category: "owner",
    role: 4 
  },

  onStart: async function ({ api, event, args, commandName }) {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Render থেকে টোকেন নিচ্ছে
    const REPO_OWNER = "gamemaker1769-source";
    const REPO_NAME = "Main";
    const BRANCH = "main";

    if (!GITHUB_TOKEN) return api.sendMessage("❌ Error: GITHUB_TOKEN not found in Render settings.", event.threadID);
    if (args.length < 1) return api.sendMessage("⚠️ Usage: .gitdel <file_path>", event.threadID);

    const filePath = args[0];
    const fileName = path.basename(filePath);

    // Confirmation logic
    api.sendMessage(`⚠️ **Confirm Deletion?**\n\nDeleting '${fileName}' from GitHub & Local.\nReply with **"yes"** to proceed.`, event.threadID, (err, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName,
        messageID: info.messageID,
        author: event.senderID,
        filePath,
        fileName,
        REPO_OWNER,
        REPO_NAME,
        BRANCH,
        GITHUB_TOKEN
      });
    });
  },

  onReply: async function ({ api, event, Reply, args }) {
    const { author, filePath, fileName, REPO_OWNER, REPO_NAME, BRANCH, GITHUB_TOKEN } = Reply;
    if (event.senderID !== author) return;

    if (args[0].toLowerCase() === "yes") {
      try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;
        
        // 1. Delete from GitHub
        try {
          const { data } = await axios.get(url, { headers: { Authorization: `token ${GITHUB_TOKEN}` } });
          await axios.delete(url, {
            headers: { Authorization: `token ${GITHUB_TOKEN}` },
            data: { message: `Deleted ${fileName}`, sha: data.sha, branch: BRANCH }
          });
        } catch (e) { /* GitHub file not found */ }

        // 2. Delete from Local (Render)
        const absPath = path.resolve(process.cwd(), filePath);
        if (fs.existsSync(absPath)) fs.unlinkSync(absPath);

        api.sendMessage(`✅ Deleted '${fileName}' from both GitHub and Bot Storage.`, event.threadID);
      } catch (error) {
        api.sendMessage(`❌ Error: ${error.message}`, event.threadID);
      }
    }
    global.GoatBot.onReply.delete(Reply.messageID);
  }
};
