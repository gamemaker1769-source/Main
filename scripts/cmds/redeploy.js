.cmd install redeploy.js const axios = require('axios'); // ✅ Lowercase 'const'

module.exports = {
  config: {
    name: "redeploy",
    aliases: ["restart", "refresh"],
    version: "6.6.1",
    author: "Light",
    shortDescription: "Restarts the bot and notifies you when online",
    category: "owner",
    role: 4
  },

  onLoad: async function({ api }) {
    const myID = "100022952830933"; 
    setTimeout(() => {
      // Small check to ensure API is ready
      if (api && api.sendMessage) {
        api.sendMessage("✅ **Bot is Online!**\nAll commands successfully loaded.", myID);
      }
    }, 10000);
  },

  onStart: async function({ api, event }) {
    // ⚠️ WARNING: Move these to Environment Variables in Render Dashboard!
    const RENDER_API_KEY = "rnd_xFJvGNwAFA0OFZbV7ComTNu1X1BM"; 
    const SERVICE_ID = "srv-d67uqop5pdvs73fnmps0"; 

    try {
      await api.sendMessage(
        "⏳ **Bot is restarting...**\nPlease wait 2-3 minutes.",
        event.threadID
      );

      // Render API requires an object, even if empty, for the POST body
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

      console.log("✅ Redeploy signal sent.");
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      api.sendMessage(`❌ Redeploy Error: ${msg}`, event.threadID);
    }
  }
};