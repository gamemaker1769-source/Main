const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "gitup",
    aliases: ["upsh", "github"],
    version: "2.7",
    author: "Light",
    shortDescription: "Upload/Create file to GitHub",
    longDescription: "Sync local files or create new files on GitHub directly from chat.",
    category: "owner",
    role: 4 
  },

  onStart: async function ({ api, event, args }) {
    // This pulls the token SECURELY from Render Environment Variables
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
    const REPO_OWNER = "gamemaker1769-source"; 
    const REPO_NAME = "Main";                  
    const BRANCH = "main";                     

    if (!GITHUB_TOKEN) {
      return api.sendMessage("❌ Error: GITHUB_TOKEN not found in Render Environment Variables. Please add it in Render Settings.", event.threadID);
    }

    if (args.length < 1) {
      return api.sendMessage("⚠️ Usage:\n1. Upload Existing: .gitup <path>\n2. Create New: .gitup <path> <code>", event.threadID);
    }

    const filePath = args[0];
    const fileContentFromArgs = args.slice(1).join(" ");
    let finalContent = "";

    // 1. Check if file exists in bot storage
    if (fs.existsSync(filePath)) {
      finalContent = fs.readFileSync(filePath, 'base64');
    } 
    // 2. If not in storage, use the code provided in the message
    else if (fileContentFromArgs) {
      finalContent = Buffer.from(fileContentFromArgs).toString('base64');
      api.sendMessage(`📝 File not found locally. Creating new file '${path.basename(filePath)}' on GitHub using provided code...`, event.threadID);
    } 
    else {
      return api.sendMessage(`❌ Error: No file found at '${filePath}' and no code was provided to create one.`, event.threadID);
    }

    try {
      const waitMsg = await api.sendMessage("⏳ Connecting to GitHub API...", event.threadID);
      const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;

      let sha = "";
      try {
        const { data } = await axios.get(url, {
          headers: { Authorization: `token ${GITHUB_TOKEN}` }
        });
        sha = data.sha;
      } catch (err) { /* New file path */ }

      await axios.put(url, {
        message: `Sync ${path.basename(filePath)} via Bot`,
        content: finalContent,
        sha: sha || undefined,
        branch: BRANCH
      }, {
        headers: { 
          Authorization: `token ${GITHUB_TOKEN}`,
          "Content-Type": "application/json"
        }
      });

      if (waitMsg.messageID) api.unsendMessage(waitMsg.messageID); 
      api.sendMessage(`✅ **Successfully Synced!**\n\n📂 **File:** ${path.basename(filePath)}\n📦 **Repo:** ${REPO_NAME}`, event.threadID);

    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      api.sendMessage(`❌ **GitHub Error:** ${errorMsg}`, event.threadID);
    }
  }
};