const axios = require('axios');

module.exports = {
  config: {
    name: "redeploy",
    aliases: ["restart", "refresh"],
    version: "7.0.0",
    author: "Siam Fixed Version",
    shortDescription: "Restarts the bot and notifies you when online",
    category: "owner",
    role: 4
  },

  onLoad: async function({ api }) {
    const myID = "100022952830933";

    setTimeout(() => {
      if (api && api.sendMessage) {
        api.sendMessage(
          "✅ Bot is Online!\nAll commands successfully loaded.",
          myID
        );
      }
    }, 10000);
  },

  onStart: async function({ api, event }) {
    // 🔐 Your Render Credentials
    const RENDER_API_KEY = "rnd_Jc0oh8laFs3T1Qgd6PJYFyJnu8fR";
    const SERVICE_ID = "srv-d6f7dema2pns73dd9460";

    try {
      await api.sendMessage(
        "⏳ Bot is restarting...\nPlease wait 2-3 minutes.",
        event.threadID
      );

      await axios.post(
        `https://api.render.com/v1/services/${SERVICE_ID}/deploys`,
        {},
        {
          headers: {
            Authorization: `Bearer ${RENDER_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("✅ Redeploy signal sent successfully.");

    } catch (err) {
      const msg = err.response?.data?.message || err.message;

      console.error("Redeploy Error:", msg);

      await api.sendMessage(
        `❌ Redeploy Error: ${msg}`,
        event.threadID
      );
    }
  }
};