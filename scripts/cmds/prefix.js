const fs = require("fs-extra");
const path = require("path");
const { utils } = global;

module.exports = {
  config: {
    name: "prefix",
    version: "4.1",
    author: "Light",
    countDown: 5,
    role: 0,
    shortDescription: "Change prefix + show random video",
    longDescription: "Change group/global prefix or show current prefix with random intro video",
    category: "config"
  },

  onStart: async function ({ message, role, args, commandName, event, threadsData }) {
    if (!args[0]) {
      return message.reply("⚠️ Please provide a new prefix!\nExample: prefix !  or  prefix reset");
    }

    if (args[0].toLowerCase() === "reset") {
      await threadsData.set(event.threadID, null, "data.prefix");
      return message.reply("✅ Prefix has been reset to default (global prefix).");
    }

    const newPrefix = args[0];
    const formSet = {
      commandName,
      author: event.senderID,
      newPrefix
    };

    if (args[1] === "-g") {
      if (role < 2) {
        return message.reply("❌ Only bot admins can change the **global** prefix.");
      }
      formSet.setGlobal = true;
    } else {
      formSet.setGlobal = false;
    }

    return message.reply("⚠️ React to this message to confirm prefix change", (err, info) => {
      if (err) return;
      formSet.messageID = info.messageID;
      global.GoatBot.onReaction.set(info.messageID, formSet);
    });
  },

  onReaction: async function ({ message, threadsData, event, Reaction }) {
    const { author, newPrefix, setGlobal, messageID } = Reaction;

    if (event.userID !== author) return;

    // Clean up reaction handler
    global.GoatBot.onReaction.delete(messageID);

    if (setGlobal) {
      global.GoatBot.config.prefix = newPrefix;
      // Important: most GoatBot forks require saving config
      // Uncomment/adapt the line below according to your bot version
      // await global.GoatBot.saveConfig?.();

      return message.reply(`✅ **Global prefix** changed to: **${newPrefix}**`);
    } else {
      await threadsData.set(event.threadID, newPrefix, "data.prefix");
      return message.reply(`✅ **Group prefix** changed to: **${newPrefix}**`);
    }
  },

  onChat: async function ({ event, message, usersData }) {
    if (!event.body) return;
    if (event.body.toLowerCase() !== "prefix") return;

    const userName = await usersData.getName(event.senderID).catch(() => "Friend");
    const botName = global.GoatBot.config.nickNameBot || "Light";

    const videoDir = path.join(__dirname, "assets");
    let prefixVideos = [];

    try {
      const files = fs.readdirSync(videoDir);
      prefixVideos = files.filter(f => 
        f.toLowerCase().startsWith("prefix") && 
        f.toLowerCase().endsWith(".mp4")
      );
    } catch (err) {
      console.error("[prefix] Cannot read assets folder:", err.message);
    }

    let bodyText = 
      `👋 Hey ${userName}\n` +
      `➥ 🌐 Global prefix: ${global.GoatBot.config.prefix}\n` +
      `➥ 💬 This chat prefix: ${utils.getPrefix(event.threadID) || global.GoatBot.config.prefix}\n\n` +
      `I'm ${botName} — at your service 🫡`;

    if (prefixVideos.length === 0) {
      return message.reply(bodyText + "\n\n❌ No prefix*.mp4 videos found in assets folder.");
    }

    // Choose random video
    const randomFile = prefixVideos[Math.floor(Math.random() * prefixVideos.length)];
    const videoPath = path.join(videoDir, randomFile);

    try {
      await message.reply({
        body: bodyText,
        attachment: fs.createReadStream(videoPath)
      });
    } catch (err) {
      console.error("[prefix] Cannot send video:", err.message);
      await message.reply(bodyText + "\n\n(⚠️ Could not send the intro video)");
    }
  }
};
