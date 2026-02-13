const fs = require("fs-extra");
const path = require("path");
const { utils } = global;

module.exports = {
  config: {
    name: "prefix",
    version: "4.0",
    author: "Light",
    countDown: 5,
    role: 0,
    description: "Change prefix + show random local video",
    category: "config"
  },

  onStart: async function ({ message, role, args, commandName, event, threadsData }) {
    if (!args[0]) return message.SyntaxError();

    if (args[0] == 'reset') {
      await threadsData.set(event.threadID, null, "data.prefix");
      return message.reply("✅ Prefix reset to default.");
    }

    const newPrefix = args[0];
    const formSet = {
      commandName,
      author: event.senderID,
      newPrefix
    };

    if (args[1] === "-g") {
      if (role < 2) return message.reply("❌ Only admin can change global prefix");
      formSet.setGlobal = true;
    } else {
      formSet.setGlobal = false;
    }

    return message.reply("⚠ React to confirm prefix change", (err, info) => {
      formSet.messageID = info.messageID;
      global.GoatBot.onReaction.set(info.messageID, formSet);
    });
  },

  onReaction: async function ({ message, threadsData, event, Reaction }) {
    const { author, newPrefix, setGlobal } = Reaction;
    if (event.userID !== author) return;

    if (setGlobal) {
      global.GoatBot.config.prefix = newPrefix;
      // যদি তোমার bot-এ config save function থাকে তাহলে এখানে কল করো
      // await global.GoatBot.saveConfig?.();
      return message.reply("✅ Global prefix changed to: " + newPrefix);
    } else {
      await threadsData.set(event.threadID, newPrefix, "data.prefix");
      return message.reply("✅ Group prefix changed to: " + newPrefix);
    }
  },

  onChat: async function ({ event, message, usersData }) {
    if (event.body && event.body.toLowerCase() === "prefix") {
      const userName = await usersData.getName(event.senderID).catch(() => "Friend");
      const botName = global.GoatBot.config.nickNameBot || "Bot";

      const videoDir = path.join(__dirname, "assets");

      // assets ফোল্ডার থেকে সব prefix*.mp4 ফাইল খুঁজে বের করা
      let prefixVideos = [];
      try {
        const allFiles = fs.readdirSync(videoDir);
        prefixVideos = allFiles.filter(file => 
          file.toLowerCase().startsWith("prefix") && 
          file.toLowerCase().endsWith(".mp4")
        );
      } catch (err) {
        console.error("assets folder read error:", err);
      }

      let videoPath;

      if (prefixVideos.length === 0) {
        return message.reply("❌ কোনো prefix*.mp4 ভিডিও assets ফোল্ডারে পাওয়া যায়নি!");
      }

      // র‍্যান্ডম একটা বেছে নেওয়া
      const randomFile = prefixVideos[Math.floor(Math.random() * prefixVideos.length)];
      videoPath = path.join(videoDir, randomFile);

      const prefixThisGroup = utils.getPrefix(event.threadID) || global.GoatBot.config.prefix;

      const bodyText = 
        `👋 হ্যাঁ ${userName}\n` +
        `➥ 🌐 Global: ${global.GoatBot.config.prefix}\n` +
        `➥ 💬 This Chat: ${prefixThisGroup}\n\n` +
        `আমি ${botName} — তোমার সেবায় প্রস্তুত 🫡`;

      try {
        return message.reply({
          body: bodyText,
          attachment: fs.createReadStream(videoPath)
        });
      } catch (err) {
        console.error("Video send error:", err);
        return message.reply(bodyText + "\n\n(ভিডিও পাঠাতে সমস্যা হয়েছে)");
      }
    }
  }
};
