const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "gitup",
    aliases: ["upsh", "github"],
    version: "4.1",
    author: "Light",
    shortDescription: "Secure Upload to GitHub",
    category: "owner",
    role: 4 
  },

  onStart: async function ({ api, event, args }) {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
    const REPO_OWNER = "gamemaker1769-source"; 
    const REPO_NAME = "Main";                  
    const BRANCH = "main";                     

    if (!GITHUB_TOKEN) return api.sendMessage("❌ Error: GITHUB_TOKEN not found in Render settings.", event.threadID);
    if (args.length < 1) return api.sendMessage("⚠️ Usage: .gitup <path>", event.threadID);

    const filePath = args[0];
    const absolutePath = path.resolve(process.cwd(), filePath);

    try {
      const waitMsg = await api.sendMessage("⏳ Securely uploading...", event.threadID);
      let finalContent = "";

      if (fs.existsSync(absolutePath)) {
        finalContent = fs.readFileSync(absolutePath, 'base64');
      } else {
        return api.sendMessage(`❌ Error: File not found at '${filePath}'`, event.threadID);
      }

      const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;

      let sha = "";
      try {
        const { data } = await axios.get(url, { headers: { Authorization: `token ${GITHUB_TOKEN}` } });
        sha = data.sha;
      } catch (err) {}

      await axios.put(url, {
        message: `Sync ${path.basename(filePath)} via Bot`,
        content: finalContent,
        sha: sha || undefined,
        branch: BRANCH
      }, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` }
      });

      api.sendMessage(`✅ Successfully synced '${path.basename(filePath)}' to GitHub!`, event.threadID);
    } catch (error) {
      api.sendMessage(`❌ GitHub Error: ${error.response?.data?.message || error.message}`, event.threadID);
    }
  }
};
