module.exports = {
	config: {
		name: "botSwitch",
		version: "1.0",
		author: "Siam",
		category: "events"
	},

	onStart: async function () {
		if (global.GoatBot.botStatus === undefined)
			global.GoatBot.botStatus = true;
	},

	onChat: async function () {
		if (global.GoatBot.botStatus === false) {
			return true; // This blocks ALL commands
		}
	}
};
