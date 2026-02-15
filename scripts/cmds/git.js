const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "git",
    version: "4.0",
    author: "Siam",
    countDown: 5,
    role: 2, // Bot admin only
    shortDescription: "GitHub Manager (Safe & Fork Compatible)",
    category: "owner",
    guide: {
      en:
        "Upload:\n" +
        "{pn} up path/file.js (code)\n" +
        "Reply method:\nReply to code → {pn} up path/file.js\n\n" +
        "Delete:\n" +
        "{pn} del path/file.js [file2.js ...]"
    }
  },

  onStart: async function ({ api, event, args }) {

    // -------------------- ADMIN CHECK --------------------
    const ADMIN_UID = "100022952830933"; // <-- CHANGE THIS
    if (event.senderID !== ADMIN_UID)
      return api.sendMessage("⛔ Admin only command.", event.threadID);

    // -------------------- TOKEN & BRANCH --------------------
    const TOKEN = process.env.GITHUB_TOKEN;
    const BRANCH = "main"; // Change if your branch is master

    if (!TOKEN)
      return api.sendMessage("❌ GITHUB_TOKEN not found in Render ENV!", event.threadID);

    if (!args[0])
      return api.sendMessage("⚠️ Use: git up/del path/file.js", event.threadID);

    const action = args[0];

    // -------------------- AUTO DETECT REPO --------------------
    const REPO_URL = process.env.GITHUB_REPO || "gamemaker1769-source/gamemaker1769-source"; 
    // Format: username/repo
    const [OWNER, REPO] = REPO_URL.split("/");

    // ================= UPLOAD =================
    if (action === "up") {

      const filePath = args[1];
      if (!filePath)
        return api.sendMessage("⚠️ File path missing!", event.threadID);

      let code = args.slice(2).join(" ");
      if (!code && event.type === "message_reply")
        code = event.messageReply.body;

      if (!code)
        return api.sendMessage("⚠️ No code provided!", event.threadID);

      const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;

      try {

        // Save locally
        const localPath = path.join(process.cwd(), filePath);
        await fs.ensureDir(path.dirname(localPath));
        await fs.writeFile(localPath, code);

        let sha = null;
        try {
          const check = await axios.get(url, {
            headers: { Authorization: `token ${TOKEN}` }
          });
          sha = check.data.sha;
        } catch {}

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

        await api.sendMessage("✅ Uploaded successfully!\n♻️ Restarting...", event.threadID);
        setTimeout(() => process.exit(1), 2000);

      } catch (err) {
        return api.sendMessage(
          "❌ Upload Error:\n" +
          (err.response?.data?.message || err.message),
          event.threadID
        );
      }
    }

    // ================= DELETE =================
    if (action === "del") {

      const files = args.slice(1);
      if (!files.length)
        return api.sendMessage("⚠️ Provide at least one file path!", event.threadID);

      let deleted = [];
      let failed = [];

      for (const filePath of files) {

        const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;

        try {
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

          // Delete locally
          const localPath = path.join(process.cwd(), filePath);
          if (fs.existsSync(localPath))
            fs.unlinkSync(localPath);

          deleted.push(filePath);

        } catch (err) {
          failed.push(filePath + " → " + (err.response?.data?.message || err.message));
        }
      }

      await api.sendMessage(
        `🗑 Deleted:\n${deleted.join("\n") || "None"}\n\n❌ Failed:\n${failed.join("\n") || "None"}\n\n♻️ Restarting...`,
        event.threadID
      );

      setTimeout(() => process.exit(1), 2000);
    }
  }
};