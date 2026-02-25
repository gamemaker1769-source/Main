const fs = require("fs-extra");
const path = require("path");
const { utils } = global;

function getRandomVideo() {
	const folderPath = path.join(__dirname, "assets");
	if (!fs.existsSync(folderPath)) return null;

	const files = fs.readdirSync(folderPath)
		.filter(f => f.toLowerCase().startsWith("prefix") && f.toLowerCase().endsWith(".mp4"));

	if (files.length === 0) return null;

	const randomFile = files[Math.floor(Math.random() * files.length)];
	return fs.createReadStream(path.join(folderPath, randomFile));
}

module.exports = {
	config: {
		name: "prefix",
		version: "1.5",
		author: "NTKhang & NeoKEX & Siam",
		countDown: 5,
		role: 0,
		description: "Change bot prefix + show random video",
		category: "config",
		guide: {
			vi: "{pn} <new prefix>: thay đổi prefix mới trong box chat của bạn\n{pn} <new prefix> -g: thay đổi prefix toàn hệ thống (chỉ admin)\n{pn} reset: reset về mặc định",
			en: "{pn} <new prefix>: change prefix in this chat\n{pn} <new prefix> -g: change global prefix (admin only)\n{pn} reset: reset prefix to default"
		}
	},

	langs: {
		vi: {
			reset: "Đã reset prefix của bạn về mặc định: %1",
			onlyAdmin: "Chỉ admin mới có thể thay đổi prefix hệ thống bot",
			confirmGlobal: "Vui lòng thả cảm xúc vào tin nhắn này để xác nhận thay đổi prefix toàn hệ thống",
			confirmThisThread: "Vui lòng thả cảm xúc vào tin nhắn này để xác nhận thay đổi prefix nhóm chat",
			successGlobal: "Đã thay đổi prefix hệ thống bot thành: %1",
			successThisThread: "Đã thay đổi prefix trong nhóm chat của bạn thành: %1",
			myPrefix: "👋 Hey %1\n➥ 🌐 Global: %2\n➥ 💬 This Chat: %3\nI'm %4 at your service 🫡"
		},
		en: {
			reset: "Your prefix reset to default: %1",
			onlyAdmin: "Only admin can change system prefix",
			confirmGlobal: "React to confirm global prefix change",
			confirmThisThread: "React to confirm chat prefix change",
			successGlobal: "Global prefix changed to: %1",
			successThisThread: "Chat prefix changed to: %1",
			myPrefix: "👋 Hey %1\n➥ 🌐 Global: %2\n➥ 💬 This Chat: %3\nI'm %4 at your service 🫡"
		}
	},

	onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
		if (!args[0]) return message.SyntaxError();

		if (args[0].toLowerCase() === "reset") {
			await threadsData.set(event.threadID, null, "data.prefix");
			const video = getRandomVideo();
			return message.reply({
				body: getLang("reset", global.GoatBot.config.prefix),
				attachment: video || undefined
			});
		}

		const newPrefix = args[0];
		const formSet = { commandName, author: event.senderID, newPrefix };

		if (args[1] === "-g") {
			if (role < 2) return message.reply(getLang("onlyAdmin"));
			formSet.setGlobal = true;
		} else formSet.setGlobal = false;

		return message.reply(
			args[1] === "-g" ? getLang("confirmGlobal") : getLang("confirmThisThread"),
			(err, info) => {
				formSet.messageID = info.messageID;
				global.GoatBot.onReaction.set(info.messageID, formSet);
			}
		);
	},

	onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
		const { author, newPrefix, setGlobal } = Reaction;
		if (event.userID !== author) return;

		if (setGlobal) {
			global.GoatBot.config.prefix = newPrefix;
			fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			const video = getRandomVideo();
			return message.reply({
				body: getLang("successGlobal", newPrefix),
				attachment: video || undefined
			});
		} else {
			await threadsData.set(event.threadID, newPrefix, "data.prefix");
			const video = getRandomVideo();
			return message.reply({
				body: getLang("successThisThread", newPrefix),
				attachment: video || undefined
			});
		}
	},

	onChat: async function ({ event, message, getLang, usersData, threadsData }) {
		if (event.body && event.body.toLowerCase() === "prefix") {
			const userName = await usersData.getName(event.senderID);
			const botName = global.GoatBot.config.nickNameBot || "Bot";

			const threadData = await threadsData.get(event.threadID);
			const threadPrefix = threadData?.data?.prefix || global.GoatBot.config.prefix;

			const video = getRandomVideo();

			return message.reply({
				body: getLang("myPrefix", userName, global.GoatBot.config.prefix, threadPrefix, botName),
				attachment: video || undefined
			});
		}
	}
};
