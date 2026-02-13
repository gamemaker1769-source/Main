const axios = require('axios');

module.exports = {
  config: {
    name: "redeploy",
    aliases: ["restart", "deploy"],
    version: "2.0",
    author: "Light",
    shortDescription: "Restart bot on Render",
    category: "owner",
    role: 4 
  },

  onStart: async function ({ api, event }) {
    // Render Dashboard-এ আপনি যে নাম দিয়েছেন (Render_API_TOKEN) সেটাই এখানে ব্যবহার করা হয়েছে
    const RENDER_API_KEY = process.env.Render_API_TOKEN; 
    const SERVICE_ID = "srv-d6790rp5pdvs73e976hg"; 

    if (!RENDER_API_KEY) {
      return api.sendMessage("❌ Error: 'Render_API_TOKEN' not found in Render Environment Variables.", event.threadID);
    }

    try {
      await api.sendMessage("⏳ Render-এ রিস্টার্ট রিকোয়েস্ট পাঠানো হচ্ছে... বটটি অফলাইন হতে পারে।", event.threadID);

      const url = `https://api.render.com/v1/services/${SERVICE_ID}/deploys`;
      
      await axios.post(url, {}, {
        headers: {
          Authorization: `Bearer ${RENDER_API_KEY}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      });

      api.sendMessage("🚀 Success! Deploy started. কয়েক মিনিটের মধ্যে বটটি আবার লাইভ হবে।", event.threadID);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      api.sendMessage(`❌ Render API Error: ${errorMsg}`, event.threadID);
    }
  }
};
