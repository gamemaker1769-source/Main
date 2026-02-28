const os = require('os');

/**
 * Formats seconds into a human-readable duration string.
 * Format: "X days, HH:MM:SS" or just "HH:MM:SS"
 */
function formatDuration(seconds) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);

    const timeFormat = [h, m, s]
        .map(t => t.toString().padStart(2, '0'))
        .join(':');

    return d > 0 ? `${d} day${d > 1 ? 's' : ''}, ${timeFormat}` : timeFormat;
}

module.exports = {
    config: {
        name: "uptime",
        aliases: ["runtime", "status", "upt", "up"],
        version: "1.3",
        author: "NeoKEX",
        countDown: 5,
        role: 0,
        longDescription: "Shows the bot's uptime and hosting environment details.",
        category: "system",
        guide: { en: "{pn}" }
    },

    onStart: async function({ message, event }) {
        const processUptimeSeconds = process.uptime();
        const botUptimeFormatted = formatDuration(processUptimeSeconds);

        const totalMemoryBytes = os.totalmem();
        const freeMemoryBytes = os.freemem();
        const usedMemoryBytes = totalMemoryBytes - freeMemoryBytes;

        const bytesToGB = (bytes) => (bytes / (1024 * 1024 * 1024)).toFixed(2);

        const totalMemoryGB = bytesToGB(totalMemoryBytes);
        const usedMemoryGB = bytesToGB(usedMemoryBytes);

        const cpuModel = os.cpus()[0].model.replace(/\s+/g, ' ');
        const osType = os.type();

        const processMemoryUsage = process.memoryUsage();
        const nodeUsedMemoryMB = (processMemoryUsage.heapUsed / 1024 / 1024).toFixed(2);

        // --- Clean, Smart & Professional UI ---
        const msg = 
            `╭─── ✨ 𝗦𝗬𝗦𝗧𝗘𝗠 𝗦𝗧𝗔𝗧𝗨𝗦 ───🌀\n` +
            `│\n` +
            `│ ⏱️  𝗨𝗽𝘁𝗶𝗺𝗲: ${botUptimeFormatted}\n` +
            `│ 🚀  𝗡𝗼𝗱𝗲JS: v${process.versions.node}\n` +
            `│ 🧠  𝗕𝗼𝘁 𝗥𝗔𝗠: ${nodeUsedMemoryMB} MB\n` +
            `│\n` +
            `├──── 🖥️  𝗛𝗢𝗦𝗧𝗜𝗡𝗚 𝗜𝗡𝗙𝗢 ────×\n` +
            `│\n` +
            `│ 📂  𝗢𝗦: ${osType} (${os.arch()})\n` +
            `│ ⚡  𝗖𝗣𝗨: ${cpuModel}\n` +
            `│ 📊  𝗦𝘆𝘀𝘁𝗲𝗺 𝗥𝗔𝗠: ${usedMemoryGB}GB / ${totalMemoryGB}GB\n` +
            `│\n` +
            `╰─────────────────────╼❐`;

        message.reply(msg);
    }
};
