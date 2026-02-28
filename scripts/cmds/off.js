module.exports = {
  config: {
    name: "off",
    version: "2.0",
    author: "Siam",
    role: 2,
    shortDescription: "Turn off bot globally",
    category: "owner"
  },

  onStart: async function ({ api, event, globalData }) {

    const botAdmins = global.GoatBot.config.adminBot || [];

    if (!botAdmins.includes(event.senderID))
      return api.sendMessage("❌ | Only Bot Admin can use this command.", event.threadID);

    await globalData.set("botStatus", { off: true });

    return api.sendMessage("🛑 | Bot is now OFF.", event.threadID);
  }
};