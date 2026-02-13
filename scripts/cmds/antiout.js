module.exports = {
 config: {
 name: "antiout",
 version: "1.0",
 author: "Chitron Bhattacharjee",
 countDown: 5,
 role: 1, // Only admin can use this command
 shortDescription: {
 en: "Prevent members from leaving the group"
 },
 longDescription: {
 en: "Enable/disable anti-out feature that automatically adds back members who leave the group"
 },
 category: "admin",
 guide: {
 en: "{pn} [on|off] - Turn anti-out feature on or off"
 }
 },

 langs: {
 en: {
 turnedOn: "🛡️ Anti-out feature has been enabled for this group",
 turnedOff: "🛡️ Anti-out feature has been disabled for this group",
 missingPermission: "❌ Sorry boss! I couldn't add the user back.\nUser %1 might have blocked me or doesn't have messenger option enabled.",
 addedBack: "%1!\n Mara kha \n"
 }
 },

 onStart: async function ({ args, message, event, threadsData, getLang }) {
 if (args[0] === "on") {
 await threadsData.set(event.threadID, true, "data.antiout");
 message.reply(getLang("turnedOn"));
 } 
 else if (args[0] === "off") {
 await threadsData.set(event.threadID, false, "data.antiout");
 message.reply(getLang("turnedOff"));
 }
 else {
 message.reply("Please specify 'on' or 'off' to enable/disable anti-out feature");
 }
 },

 onEvent: async function ({ event, api, threadsData, usersData, getLang }) {
 if (event.logMessageType !== "log:unsubscribe") 
 return;

 const antiout = await threadsData.get(event.threadID, "data.antiout");
 if (!antiout) 
 return;

 if (event.logMessageData.leftParticipantFbId === api.getCurrentUserID()) 
 return;

 const name = await usersData.getName(event.logMessageData.leftParticipantFbId);

 try {
 await api.addUserToGroup(event.logMessageData.leftParticipantFbId, event.threadID);
 api.sendMessage(getLang("addedBack", name), event.threadID);
 } 
 catch (error) {
 api.sendMessage(getLang("missingPermission", name), event.threadID);
 }
 }
};