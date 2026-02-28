const axios = require('axios');
const fs = require('fs');

// Path to store the restart info temporarily
const RESTART_FILE = './restart_info.json';

module.exports = {
  config: {
    name: "redeploy",
    aliases: ["restart", "refresh"],
    version: "7.1.0",
    author: "Siam Fixed Version",
    shortDescription: "Restarts the bot and notifies you when online",
    category: "owner",
    role: 4
  },

  onLoad: async function({ api }) {
    const myID = "100022952830933";

    // Check if there's a pending notification from a previous restart
    if (fs.existsSync(RESTART_FILE)) {
      const data = JSON.parse(fs.readFileSync(RESTART_FILE));
      
      setTimeout(() => {
        const statusMsg = "✅ 𝗕𝗼𝘁 𝗶𝘀 𝗢𝗻𝗹𝗶𝗻𝗲!\nAll systems are operational and commands are ready.";
        
        // Notify the thread where the command was triggered
        if (data.threadID) api.sendMessage(statusMsg, data.threadID);
        
        // Also notify the owner
        if (myID && data.threadID !== myID) api.sendMessage(statusMsg, myID);

        // Delete the file so it doesn't spam on every restart
        fs.unlinkSync(RESTART_FILE);
      }, 10000);
    }
  },

  onStart: async function({ api, event }) {
    const RENDER_API_KEY = "rnd_Jc0oh8laFs3T1Qgd6PJYFyJnu8fR";
    const SERVICE_ID = "srv-d6f7dema2pns73dd9460";

    try {
      await api.sendMessage(
        "⏳ 𝗦𝘆𝘀𝘁𝗲𝗺 𝗥𝗲𝘀𝘁𝗮𝗿𝘁𝗶𝗻𝗴...\nInitiating redeploy on Render. Please wait 2-3 minutes.",
        event.threadID
      );

      // Save current thread ID so we can reply to it after restart
      fs.writeFileSync(RESTART_FILE, JSON.stringify({ threadID: event.threadID }));

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

      if (fs.existsSync(RESTART_FILE)) fs.unlinkSync(RESTART_FILE);

      await api.sendMessage(
        `❌ 𝗥𝗲𝗱𝗲𝗽𝗹𝗼𝘆 𝗙𝗮𝗶𝗹𝗲𝗱\nError: ${msg}`,
        event.threadID
      );
    }
  }
};
