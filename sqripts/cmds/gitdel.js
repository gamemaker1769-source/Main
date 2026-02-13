const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
 config: {
 name: "gitdel",
 aliases: ["dlt", "ghdelete"],
 version: "4.0",
 author: "Light",
 shortDescription: "Delete file from GH & Local (Full Fixed)",
 longDescription: "Removes a file from GitHub repository and bot storage with a safety check.",
 category: "owner",
 role: 4 // Owner Only
 },

 onStart: async function ({ api, event, args, commandName }) {
 const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
 const REPO_OWNER = "gamemaker1769-source";
 const REPO_NAME = "Main";
 const BRANCH = "main";

 if (!GITHUB_TOKEN) {
 return api.sendMessage("❌ Error: GITHUB_TOKEN not found in Render settings.", event.threadID);
 }

 if (args.length < 1) {
 return api.sendMessage("⚠️ Usage: .gitdel <file_path>\nExample: .gitdel scripts/cmds/test.js", event.threadID);
 }

 const filePath = args[0];
 const fileName = path.basename(filePath);

 // Confirmation Message
 const confirmMsg = ⚠️ **ARE YOU SURE?**\n\nThis will permanently delete '${fileName}' from:\n1. GitHub Repository\n2. Bot's Local Memory\n\nType **"yes"** to confirm or anything else to cancel.;

 api.sendMessage(confirmMsg, event.threadID, (err, info) => {
 if (err) return;

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

 // 20-second safety timeout
 setTimeout(() => {
 if (global.GoatBot.onReply.has(info.messageID)) {
 global.GoatBot.onReply.delete(info.messageID);
 api.sendMessage(⏰ Time out! Deletion of '${fileName}' cancelled., event.threadID);
 }
 }, 20000);
 });
 },

 onReply: async function ({ api, event, Reply, args }) {
 const { author, filePath, fileName, REPO_OWNER, REPO_NAME, BRANCH, GITHUB_TOKEN } = Reply;
 if (event.senderID !== author) return;

 const response = args[0].toLowerCase();

 if (response === "yes") {
 try {
 const url = https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath};
 api.sendMessage(⏳ Deleting '${fileName}' everywhere..., event.threadID);

 // 1. GitHub থেকে ডিলিট করা
 let githubStatus = "⚠️ Not found on GitHub";
 try {
 const { data } = await axios.get(url, { headers: { Authorization: token ${GITHUB_TOKEN} } });
 await axios.delete(url, {
 headers: { Authorization: token ${GITHUB_TOKEN} },
 data: { message: Deleted ${fileName} via Bot, sha: data.sha, branch: BRANCH }
 });
 githubStatus = "✅ Removed from GitHub";
 } catch (e) {
 // GitHub-এ না থাকলে এরর স্কিপ করবে
 }

 // 2. Local Storage (Render) থেকে ডিলিট করা (Full Fix)
 let localStatus = "⚠️ Not found locally";
 const absolutePath = path.resolve(process.cwd(), filePath); // সঠিক পাথ খুঁজে পাওয়ার জন্য

 if (fs.existsSync(absolutePath)) {
 fs.unlinkSync(absolutePath);
 localStatus = "✅ Removed from Local Storage";
 }

 api.sendMessage(🗑️ **Deletion Summary:**\n\n📂 **File:** ${fileName}\n🌐 ${githubStatus}\n💻 ${localStatus}, event.threadID);
 } catch (error) {
 api.sendMessage(❌ Error: ${error.message}, event.threadID);
 }
 } else {
 api.sendMessage(❌ Deletion cancelled., event.threadID);
 }

 global.GoatBot.onReply.delete(Reply.messageID);
 }
};