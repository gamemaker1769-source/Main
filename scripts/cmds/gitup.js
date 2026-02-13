const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "gitup",
    aliases: ["upsh", "github"],
    version: "2.5",
    author: "Light",
    shortDescription: "Upload/Create file to GitHub",
    longDescription: "Upload existing file or create a new file from content to GitHub.",
    category: "owner",
    role: 4 
  },

  onStart: async function ({ api, event, args }) {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
    const REPO_OWNER = "gamemaker1769-source"; 
    const REPO_NAME = "Main";                  
    const BRANCH = "main";                     

    if (!GITHUB_TOKEN) {
      return api.sendMessage("❌ Error: GITHUB_TOKEN not found in Render Environment Variables.", event.threadID);
    }

    if (args.length < 1) {
      return api.sendMessage("⚠️ Usage:\n1. For existing file: gitup <path>\n2. To create new: gitup <path> <code>", event.threadID);
    }

    const filePath = args[0];
    const fileContentFromArgs = args.slice(1).join(" ");
    let finalContent = "";

    // চেক করা হচ্ছে ফাইলটি লোকালি আছে কি না
    if (fs.existsSync(filePath)) {
      finalContent = fs.readFileSync(filePath, 'base64');
    } 
    // যদি না থাকে এবং আপনি নতুন কোড দিয়ে থাকেন
    else if (fileContentFromArgs) {
      finalContent = Buffer.from(fileContentFromArgs).toString('base64');
      api.sendMessage(`📝 Local file not found. Creating a new file on GitHub with provided content...`, event.threadID);
    } 
    else {
      return api.sendMessage(`❌ Error: File not found at '${filePath}' and no code content was provided to create a new one.`, event.threadID);
    }

    try {
      const waitMsg = await api.sendMessage("⏳ Processing GitHub upload...", event.threadID);
      const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;

      let sha = "";
      try {
        const { data } = await axios.get(url, {
          headers: { Authorization: `token ${GITHUB_TOKEN}` }
        });
        sha = data.sha;
      } catch (err) { /* File is new */ }

      await axios.put(url, {
        message: `Updated/Created ${path.basename(filePath)} via Bot`,
        content: finalContent,
        sha: sha || undefined,
        branch: BRANCH
      }, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` }
      });

      api.unsendMessage(waitMsg.messageID); 
      api.sendMessage(`✅ Successfully synced '${path.basename(filePath)}' to GitHub!`, event.threadID);

    } catch (error) {
      api.sendMessage(`❌ GitHub Error: ${error.response?.data?.message || error.message}`, event.threadID);
    }
  }
};
