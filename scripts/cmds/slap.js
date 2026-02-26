const DIG = require("discord-image-generation");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "slap",
    version: "1.1",
    author: "NTKhang",
    countDown: 5,
    role: 0,
    shortDescription: "Batslap image",
    longDescription: "Batslap image",
    category: "fun",
    guide: {
      en: "   {pn} @tag or reply to a message"
    }
  },

  langs: {
    vi: {
      noTag: "Bạn phải tag người bạn muốn tát hoặc trả lời tin nhắn",
    },
    en: {
      noTag: "You must tag the person you want to slap or reply to their message",
    }
  },

  onStart: async function ({ event, message, usersData, args, getLang }) {
    const uid1 = event.senderID;
    let uid2 = Object.keys(event.mentions)[0];

    // যদি mention না করা হয়, তাহলে reply করা মেসেজের sender ID নেবে
    if (!uid2 && event.type == "message_reply") {
      uid2 = event.messageReply.senderID;
    }

    if (uid2 === "100068909067279"){
        return message.reply("slap yourself hala bkcd!? this is my owner 🦆💨")};

    if (!uid2) return message.reply(getLang("noTag"));

    const avatarURL1 = await usersData.getAvatarUrl(uid1);
    const avatarURL2 = await usersData.getAvatarUrl(uid2);

    const img = await new DIG.Batslap().getImage(avatarURL1, avatarURL2);
    const pathSave = `${__dirname}/tmp/${uid1}_${uid2}Batslap.png`;

    fs.writeFileSync(pathSave, Buffer.from(img));

    const content = args.join(' ').replace(Object.keys(event.mentions)[0], "");
    message.reply(
      {
        body: `${content || "chup nah hoy arekhta dimu 🙂✌️"}`,
        attachment: fs.createReadStream(pathSave)
      },
      () => fs.unlinkSync(pathSave)
    );
  }
};