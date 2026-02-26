const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "help",
    aliases: ["menu", "commands", "cmd", "h"],
    version: "6.4",
    author: "Light x Siam",
    shortDescription: "Help with Random Video",
    category: "system",
    guide: "{pn} → show menu\n{pn} <page>\n{pn} <command>"
  },

  onStart: async function ({ message, args, prefix }) {
    const allCommands = global.GoatBot.commands;
    const commands = [...allCommands.values()];
    const perPage = 10;

    // ───── HELPER: EXTRACT TEXT FROM STRING OR OBJECT ─────
    const getText = (data) => {
      if (typeof data === "string") return data;
      if (typeof data === "object" && data !== null) {
        return data.en || data.vi || Object.values(data)[0] || "";
      }
      return "";
    };

    // ───── COMMAND INFO (SINGLE COMMAND) ─────
    if (args[0] && isNaN(args[0])) {
      const query = args[0].toLowerCase();
      const cmd =
        allCommands.get(query) ||
        commands.find(c =>
          (c.config.aliases || []).includes(query)
        );

      if (!cmd)
        return message.reply(`❌ Command "${query}" not found.`);

      const cfg = cmd.config;
      
      // Safe extraction of guide and description
      const guideText = getText(cfg.guide);
      const descText = getText(cfg.shortDescription) || getText(cfg.description) || "No description";

      return message.reply(
        `╭──『 ${prefix}${cfg.name} 』──╮\n` +
        `│ Description: ${descText}\n` +
        `│ Aliases: ${(cfg.aliases || []).join(", ") || "None"}\n` +
        `│ Category: ${cfg.category || "others"}\n` +
        `╰──────────────────╯\n\n` +
        `Usage:\n${guideText.replace(/{pn}/g, prefix)}`
      );
    }

    // ───── PAGE SYSTEM (MENU) ─────
    let page = parseInt(args[0]) || 1;
    const totalPages = Math.ceil(commands.length / perPage);
    if (page < 1 || page > totalPages) page = 1;

    const start = (page - 1) * perPage;
    const currentCommands = commands.slice(start, start + perPage);

    let menu =
`╭━━━『 ✦ LIGHT BOT ✦ 』━━━╮
│ Prefix: ${prefix}
│ Page: ${page}/${totalPages}
│ Total Commands: ${commands.length}
╰━━━━━━━━━━━━━━━━━━╯\n\n`;

    currentCommands.forEach(cmd => {
      menu += `• ${prefix}${cmd.config.name}\n`;
    });

    menu += `\n━━━━━━━━━━━━━━━━━━\n` +
            `Type ${prefix}help <page>\n` +
            `Type ${prefix}help <command>`;

    // ───── RANDOM VIDEO ATTACHMENT ─────
    const assetsPath = path.resolve("scripts/cmds/assets");

    const possibleVideos = [
      "prefix1.mp4", "prefix2.mp4", "prefix3.mp4", "prefix4.mp4",
      "prefix5.mp4", "prefix6.mp4", "prefix7.mp4", "prefix8.mp4"
    ];

    const availableVideos = possibleVideos.filter(file =>
      fs.existsSync(path.join(assetsPath, file))
    );

    if (availableVideos.length > 0) {
      const randomVideo =
        availableVideos[Math.floor(Math.random() * availableVideos.length)];

      try {
        return message.reply({
          body: menu,
          attachment: fs.createReadStream(path.join(assetsPath, randomVideo))
        });
      } catch (err) {
        // Fallback if video fails to stream
        return message.reply(menu);
      }
    }

    return message.reply(menu);
  }
};