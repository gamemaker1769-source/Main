module.exports = {
	config: {
		name: "off",
		version: "1.0",
		author: "Siam",
		role: 2,
		category: "system",
		shortDescription: "Turn bot off"
	},

	onStart: async function ({ message }) {
		global.GoatBot.botStatus = false;
		return message.reply("🔴 Bot is now OFF.");
	}
};
