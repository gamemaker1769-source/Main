const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "gitup",
    aliases: ["upsh", "github"],
    version: "5.5",
    author: "Light",
    shortDescription: "Upload files, code, or media safely to GitHub",
    category: "owner",
    role: 2 
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, type, messageReply } = event;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = "gamemaker1769-source";
    const REPO_NAME = "Main";
    const BRANCH = "main";

    if (!GITHUB_TOKEN) return api.sendMessage("❌ Error: GITHUB_TOKEN পাওয়া যায়নি!", threadID, messageID);

    try {
      let finalContent, githubPath;

      // --- রিপ্লাই দিয়ে ফাইল বা মিডিয়া হ্যান্ডলিং ---
      if (type === "message_reply") {
        const attachment = messageReply.attachments[0];
        
        // ১. যদি মিডিয়া ফাইল (ভিডিও/ইমেজ) হয়
        if (attachment && (attachment.type === "video" || attachment.type === "photo" || attachment.type === "audio")) {
          await api.sendMessage(`⏳ Media processing...`, threadID, messageID);
          const fileName = args[0] || attachment.filename || `media_${Date.now()}`;
          const getMedia = await axios.get(attachment.url, { responseType: 'arraybuffer' });
          finalContent = Buffer.from(getMedia.data).toString('base64');
          githubPath = args[0] || `assets/${fileName}`;
        } 
        // ২. যদি সরাসরি কোড বা টেক্সট রিপ্লাই হয় (এটি HTML হওয়া আটকাবে)
        else {
          if (!messageReply.body) return api.sendMessage("⚠️ রিপ্লাইতে কোনো কোড বা মিডিয়া পাওয়া যায়নি!", threadID, messageID);
          await api.sendMessage(`⏳ Processing code/text...`, threadID, messageID);
          finalContent = Buffer.from(messageReply.body, 'utf-8').toString('base64');
          githubPath = args[0] || `scripts/cmds/new_cmd.js`;
        }
      } 
      // --- লোকাল পাথ ব্যবহার করে আপলোড ---
      else {
        if (args.length < 1) return api.sendMessage("⚠️ ব্যবহার: মিডিয়া/কোডে রিপ্লাই দিয়ে '.gitup path/name.js' লিখুন।", threadID, messageID);
        const localPath = path.resolve(process.cwd(), args[0]);
        if (!fs.existsSync(localPath)) return api.sendMessage(`❌ ফাইল পাওয়া যায়নি: ${args[0]}`, threadID, messageID);
        
        finalContent = fs.readFileSync(localPath, 'base64');
        githubPath = args[0];
      }

      await api.sendMessage(`⏳ GitHub-ey upload hochhe...`, threadID, messageID);
      
      const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${githubPath}`;
      let sha = "";
      try {
        const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } });
        sha = data.sha;
      } catch (e) {}

      await axios.put(url, {
        message: `Upload via Bot: ${path.basename(githubPath)}`,
        content: finalContent,
        sha: sha || undefined,
        branch: BRANCH
      }, {
        headers: { 
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          "Content-Type": "application/json"
        }
      });

      return api.sendMessage(`✅ Successfully Uploaded!\n📂 Path: ${githubPath}`, threadID, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage(`❌ এরর: ${error.response?.data?.message || error.message}`, threadID, messageID);
    }
  }
};