const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "git",
    version: "2.1",
    author: "Siam + ChatGPT",
    countDown: 5,
    role: 2, // Only bot admin
    shortDescription: "GitHub Manager",
    longDescription: "Upload/Delete files to GitHub (Admin Only)",
    category: "owner"
  },

  onStart: async function ({ api, event, args }) {

    // 🔐 EXTRA SECURITY (Replace with your Facebook UID)
    const ADMIN_UID = "100022952830933";

    if (event.senderID !== ADMIN_UID) {
      return api.sendMessage("⛔ You are not authorized to use this command.", event.threadID);
    }

    const OWNER = "NeoKEX";
    const REPO = "Goatbot-updated";
    const BRANCH = "main";
    const TOKEN = process.env.GITHUB_TOKEN; // Use ENV (Render safe)

    if (!TOKEN)
      return api.sendMessage("❌ GitHub token not found in ENV!", event.threadID);

    if (!args[0])
      return api.sendMessage("⚠️ Use: git up/del path/file.js", event.threadID);

    const action = args[0];
    const filePath = args[1];

    if (!filePath)
      return api.sendMessage("⚠️ File path missing!", event.threadID);

    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;

    try {

      // ================= UPLOAD =================
      if (action === "up") {

        let code = args.slice(2).join(" ");

        if (!code && event.type === "message_reply") {
          code = event.messageReply.body;
        }

        if (!code)
          return api.sendMessage("⚠️ No code provided!", event.threadID);

        // Save locally
        const localPath = path.join(process.cwd(), filePath);
        await fs.ensureDir(path.dirname(localPath));
        await fs.writeFile(localPath, code);

        let sha;
        try {
          const check = await axios.get(url, {
            headers: { Authorization: `token ${TOKEN}` }
          });
          sha = check.data.sha;
        } catch (e) {}

        await axios.put(
          url,
          {
            message: `Upload ${filePath}`,
            content: Buffer.from(code).toString("base64"),
            branch: BRANCH,
            sha: sha || undefined
          },
          {
            headers: {
              Authorization: `token ${TOKEN}`,
              "Content-Type": "application/json"
            }
          }
        );

        await api.sendMessage("✅ Uploaded successfully!\n♻️ Restarting bot...", event.threadID);

        setTimeout(() => process.exit(1), 2000);
      }

      // ================= DELETE =================
      if (action === "del") {

        const check = await axios.get(url, {
          headers: { Authorization: `token ${TOKEN}` }
        });

        await axios.delete(url, {
          headers: {
            Authorization: `token ${TOKEN}`,
            "Content-Type": "application/json"
          },
          data: {
            message: `Delete ${filePath}`,
            sha: check.data.sha,
            branch: BRANCH
          }
        });

        const localPath = path.join(process.cwd(), filePath);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }

        await api.sendMessage("🗑 Deleted successfully!\n♻️ Restarting bot...", event.threadID);

        setTimeout(() => process.exit(1), 2000);
      }

    } catch (err) {
      console.log(err.response?.data || err);
      return api.sendMessage("❌ Error occurred!", event.threadID);
    }
  }
};