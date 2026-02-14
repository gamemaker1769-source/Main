module.exports = {
	config: {
		name: "botSwitch",
		version: "1.1",
		author: "Siam",
		category: "events"
	},

	onStart: async function () {
		if (global.GoatBot.botStatus === undefined)
			global.GoatBot.botStatus = true;
	},

	onChat: async function ({ event }) {

		// If bot is OFF
		if (global.GoatBot.botStatus === false) {

			// Allow only .on command
			if (event.body && event.body.startsWith(".on")) {
				global.GoatBot.botStatus = true;
				return false; // allow execution
			}

			// Block EVERYTHING else
			return true;
		}
	}
};
