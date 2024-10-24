require("./config")
const {
    smsg, getGroupAdmins, isUrl, sleep, generateProfilePicture, parseMention
} = require('./lib/myfunction')
const { downloadContentFromMessage, prepareWAMessageMedia, MediaType } = require('@whiskeysockets/baileys')
const axios = require('axios')
const fs = require('fs')
const { TelegraPh, UploadFileUgu } = require('./lib/Upload_Url');
const { performance } = require('perf_hooks')
const moment = require('moment-timezone')

// Base
module.exports = async (Kaizen, m) => {
    try {
        const from = m.key.remoteJid
        const quoted = m.quoted ? m.quoted : m
        const body = (m.mtype === 'conversation') ? m.message.conversation :
            (m.mtype == 'imageMessage') ? m.message.imageMessage.caption :
            (m.mtype == 'videoMessage') ? m.message.videoMessage.caption :
            (m.mtype == 'extendedTextMessage') ? m.message.extendedTextMessage.text : ''
        const isCmd = body.startsWith('.');
        const command = isCmd ? body.slice(1).trim().split(' ').shift().toLowerCase() : '';
        const args = body.trim().split(/ +/).slice(1)
        const text = args.join(" ")
        const sender = m.isGroup ? (m.key.participant ? m.key.participant : m.participant) : m.key.remoteJid
        const botNumber = await Kaizen.decodeJid(Kaizen.user.id)
        const isCreator = ["6283857564133@s.whatsapp.net", botNumber].includes(m.sender)
        const pushname = m.pushName || sender.split('@')[0]
        const mime = (quoted.msg || quoted).mimetype || quoted.mediaType || "";
        const isMedia = /image|video|sticker|audio/.test(mime)
        const groupMetadata = m.isGroup ? await Kaizen.groupMetadata(m.chat).catch(e => {}) : ''
        const groupAdmins = m.isGroup ? await getGroupAdmins(groupMetadata.participants) : ''
        const isBotAdmins = m.isGroup ? groupAdmins.includes(botNumber) : false
        const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false

        // Waktu salam
        const time2 = moment().tz("Asia/Jakarta").format("HH:mm:ss")
        let ucapanWaktu = "Selamat Malam🌃"
        if (time2 < "15:00:00") ucapanWaktu = "Selamat Sore🌄"
        if (time2 < "11:00:00") ucapanWaktu = "Selamat Siang🏞️"
        if (time2 < "06:00:00") ucapanWaktu = "Selamat Pagi🏙️"

        const reply = async(teks) => {
            Kaizen.sendMessage(
                from, { text: teks },
                { quoted: { key: { fromMe: false, participant: `0@s.whatsapp.net` }, message: { 'contactMessage': { 'displayName': `Kaizen` }}} }
            )
        }

        switch (command) {
            case "upsaluran":
            case "upch": {
                reply("Mohon Tunggu Proses Nya Kak");
                await Kaizen.sendMessage(`${global.idch}`, { 
                    audio: await m.quoted.download(), 
                    mimetype: 'audio/mp4', 
                    ptt: true 
                });
                await sleep(2000);
                Kaizen.sendMessage(m.chat, { 
                    text: "☘️ Audio Berhasil Di Upload Silahkan Cek Saluran"
                });
            }
            break;

            default:
                if (body.startsWith('>')) {
                    if (!isCreator) return reply(`*[ System Notice ]* cannot access`)
                    try {
                        let evaled = await eval(body.slice(2))
                        if (typeof evaled !== 'string') evaled = require('util').inspect(evaled)
                        await reply(evaled)
                    } catch (err) {
                        reply(String(err))
                    }
                }
        }
    } catch (err) {
        console.error(err)
    }
}
