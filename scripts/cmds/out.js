module.exports = {
  config: {
    name: "out",
    aliases: ["l", "leave", "kickself", "bye"],
    version: "1.5",
    author: "Siam & Sandy → GoatBot adapted",
    countDown: 10,
    role: 0,
    shortDescription: "Make bot (Light) leave group(s)",
    longDescription: "Light leaves current group or all other groups (except current one)",
    category: "owner",
    guide: {
      en: "{pn} [all | threadID (optional)]"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const botID = api.getCurrentUserID();
    const ownerID = "100022952830933"; // ← your owner UID
    const senderID = event.senderID;
    const currentTID = event.threadID;

    // Restrict to bot itself or owner only
    if (senderID !== botID && senderID !== ownerID) {
      return message.reply(
        "𝗔𝗰𝗰𝗲𝘀𝘀 𝗗𝗲𝗻𝗶𝗲𝗱!\n\n" +
        "Only Light (the bot) itself or the bot owner can use this command."
      );
    }

    // ─── .out all ─── Leave all other groups except current
    if (args[0] && args[0].toLowerCase() === "all") {
      try {
        // Fetch up to 100 recent threads (FB usually limits this)
        const threads = await api.getThreadList(100, null, ["INBOX"]);
        const otherGroups = threads.filter(
          t => t.isGroup && String(t.threadID) !== String(currentTID)
        );

        if (otherGroups.length === 0) {
          return message.reply("No other groups found where Light is present.");
        }

        await message.reply(`Light is preparing to leave ${otherGroups.length} other group(s)...`);

        let success = 0;
        let failed = 0;

        for (const group of otherGroups) {
          try {
            await api.sendMessage("𝙻𝙸𝙶𝙷𝚃 𝙸𝚂 𝙻𝙴𝙰𝚅𝙸𝙽𝙶... 👋", group.threadID);
            await api.removeUserFromGroup(botID, group.threadID);
            success++;
          } catch (err) {
            failed++;
            console.log(`Failed to leave group ${group.threadID}: ${err.message || err}`);
          }
        }

        return message.reply(
          `Operation completed!\n\n` +
          `Successfully left: ${success} group(s)\n` +
          `Failed to leave: ${failed} group(s)`
        );
      } catch (err) {
        console.error("Error fetching threads (all mode):", err);
        return message.reply("Error: Could not get the list of groups. Try again later.");
      }
    }

    // ─── .out   or   .out <threadID> ─── Leave specific / current group
    let targetTID = currentTID;

    if (args[0]) {
      targetTID = args[0].trim();
      if (!/^\d+$/.test(targetTID)) {
        return message.reply("Invalid thread ID format.\nExample: .out 1000123456789");
      }
    }

    try {
      // Try to send goodbye message (fails silently if no permission / already left / etc.)
      try {
        await api.sendMessage("𝙻𝙸𝙶𝙷𝚃 𝙸𝚂 𝙻𝙴𝙰𝚅𝙸𝙽𝙶 𝚃𝙷𝙸𝚂 𝙶𝚁𝙾𝚄𝙿... 👋", targetTID);
      } catch (silentErr) {
        // ignore – very common
      }

      await api.removeUserFromGroup(botID, targetTID);

      // Only reply if leaving a DIFFERENT group
      if (String(targetTID) !== String(currentTID)) {
        return message.reply(`Light has successfully left group ${targetTID}.`);
      }

      // Current group → can't reply after leaving, just log
      console.log(`Light left the current group: ${currentTID}`);

    } catch (error) {
      console.error("Leave failed:", error);

      return message.reply(
        "Light couldn't leave the group.\n\n" +
        "Possible reasons:\n" +
        "• Light is not in that group\n" +
        "• Missing permissions\n" +
        "• Facebook blocked the action (rate limit / spam detection)"
      );
    }
  }
};
