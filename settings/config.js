const fs = require('fs')

const config = {
    owner: "-",
    botNumber: "-",
    setPair: "CLANAKUM",
    thumbUrl: "https://files.catbox.moe/dvd8po.jpeg",
    session: "sessions",
    self: false,
    status: {
        public: true,
        terminal: true,
        reactsw: false
    },
    message: {
owner: '*ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ ɪs ᴜsᴇᴅ ᴏɴʟʏ ғᴏʀ ᴏᴡɴᴇʀ.*',
premium: '*ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ ɪs ᴜsᴇᴅ ᴏɴʟʏ ғᴏʀ ᴘʀᴇᴍɪᴜᴍ.*',
succes: '*sᴜᴄᴄᴇssғᴜʟʟʏ.*',
group: '*ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ ɪs ᴏɴʟʏ ᴜsᴇᴅ ɪɴ ɢʀᴏᴜᴘ.*',
admins: '*ᴛʜᴇ ʙᴏᴛ ᴍᴜsᴛ ʙᴇ ᴀᴅᴍɪɴ ᴏғ ᴛʜᴇ ɢʀᴏᴜᴘ.*'
    },
    settings: {
        title: "×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×",
        packname: '𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄🦠',
        description: "this script was created by ×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×",
        author: '×͜× 𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀 ×͜×',
        footer: "×͜×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×͜× - 2026"
    },
    newsletter: {
        name: "🩸⃟𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄🦠",
        id: "120363404493590395@newsletter"
    },
    socialMedia: {
        YouTube: "https://youtube.com/@marvensprivv",
        GitHub: "https://github.com/dsprimis",
        Telegram: "https://t.me/Dracula509",
        ChannelWA: "https://whatsapp.com/channel/0029VbCFoFrCcW4txYtoCH2F"
    }
}

global.newsletterID = "120363404493590395@newsletter"
global.newsletterName = "🩸⃟༑𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄🦠"

module.exports = config;

let file = require.resolve(__filename)
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file)
  console.log('\x1b[0;32m'+__filename+' \x1b[1;32mupdated!\x1b[0m')
  delete require.cache[file]
  require(file)
})
