module.exports.config = {
  name: "onoff",
  aliases: ["on", "off"],
  version: "2.0.0",
  hasPermssion: 2,
  credits: "RISE OF GAMING",
  description: "Total bot lockdown (Admin Only)",
  commandCategory: "admin",
  usages: ".on / .off",
  cooldowns: 0
};

const ADMIN_ID = "100022952830933";

// Ensure the global state exists
if (global.isBotDisabled === undefined) {
  global.isBotDisabled = false;
}

module.exports.onStart = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (senderID !== ADMIN_ID) return;

  const input = args[0] ? args[0].toLowerCase() : "";

  if (input === "off" || event.body.toLowerCase() === ".off") {
    global.isBotDisabled = true;
    return api.sendMessage("🛑 Bot is now SHUT DOWN. All systems ignored.", threadID, messageID);
  }

  if (input === "on" || event.body.toLowerCase() === ".on") {
    global.isBotDisabled = false;
    return api.sendMessage("🚀 Bot is now ACTIVE. Systems restored.", threadID, messageID);
  }
};

module.exports.handleEvent = async function ({ api, event }) {
  const { body, senderID, threadID, messageID } = event;
  if (!body) return;

  const msg = body.trim().toLowerCase();

  // THE WALL: If disabled, check ONLY for the wake-up call
  if (global.isBotDisabled) {
    if (msg === ".on" && senderID === ADMIN_ID) {
      global.isBotDisabled = false;
      return api.sendMessage("⚡ System Restarted. Bot is back online!", threadID, messageID);
    }

    // This is the critical part: 
    // It intercepts the message before the "Prefix" or "Help" handlers can see it.
    if (typeof stop === "function") return stop(); 
    return false; 
  }
};
