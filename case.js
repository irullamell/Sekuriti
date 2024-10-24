require("./config")
const { smsg, getGroupAdmins, isUrl, sleep } = require('./lib/myfunction')
const { downloadContentFromMessage, MediaType } = require('@whiskeysockets/baileys')
const fs = require('fs')
const moment = require('moment-timezone')

// Base
module.exports = async (Kaizen, m) => {
    try {
        const from = m.key.remoteJid;
        const quoted = m.quoted || m;
        const body = m.message?.conversation || m.message?.imageMessage?.caption || m.message?.videoMessage?.caption || m.message?.extendedTextMessage?.text || '';
        const commandPrefix = '.';
        const isCmd = body.startsWith(commandPrefix);
        const command = isCmd ? body.slice(1).trim().split(' ')[0].toLowerCase() : '';
        const args = body.trim().split(/\s+/).slice(1);
        const sender = m.isGroup ? m.key.participant || m.participant : m.key.remoteJid;
        const botNumber = await Kaizen.decodeJid(Kaizen.user.id);
        const isCreator = ["6283857564133@s.whatsapp.net", botNumber].includes(m.sender);
        const pushname = m.pushName || sender.split('@')[0];
        const mime = quoted.mimetype || quoted.mediaType || '';
        const isMedia = /image|video|sticker|audio|document/.test(mime);

        // Salam waktu berdasarkan timezone Asia/Jakarta
        const currentHour = moment().tz("Asia/Jakarta").hours();
        const ucapanWaktu = currentHour >= 18 ? "Selamat Malam🌃" :
                             currentHour >= 15 ? "Selamat Sore🌄" :
                             currentHour >= 11 ? "Selamat Siang🏞️" :
                             currentHour >= 6 ? "Selamat Pagi🏙️" : "Selamat Subuh🌆";

        // Fungsi untuk merespon pesan
        const reply = async (teks) => {
            await Kaizen.sendMessage(
                from, { text: teks },
                { quoted: { key: { fromMe: false, participant: `0@s.whatsapp.net` }, message: { 'contactMessage': { 'displayName': `Kaizen` }}} }
            );
        };

        // Fungsi untuk mengirim media ke saluran (channel)
        const uploadMediaToChannel = async (mediaType, mediaContent) => {
            let options = {};
            
            // Konfigurasi berdasarkan tipe media
            if (mediaType === 'image') {
                options = { image: mediaContent, caption: "🖼️ Gambar Berhasil Diunggah" };
            } else if (mediaType === 'video') {
                options = { video: mediaContent, caption: "🎥 Video Berhasil Diunggah" };
            } else if (mediaType === 'audio') {
                options = { audio: mediaContent, mimetype: 'audio/mp4', ptt: true };
            } else if (mediaType === 'document') {
                options = { document: mediaContent, mimetype: quoted.mimetype, fileName: quoted.fileName || 'dokumen' };
            } else if (mediaType === 'sticker') {
                options = { sticker: mediaContent };
            }

            await Kaizen.sendMessage(`${global.idch}`, options); // Upload ke channel
            await sleep(2000); // Beri jeda agar tidak terjadi masalah pengunggahan
            await reply("☘️ Media Berhasil Diunggah ke Saluran, silakan cek.");
        };

        // Fungsi untuk memberikan petunjuk penggunaan
        const sendUsageInstructions = async () => {
            const usageText = `
📌 *Cara Menggunakan Perintah UPCH (Upload Channel)*:

1. Kirim media (gambar, video, audio, dokumen, atau stiker) di chat.
2. Setelah mengirim media, balas media tersebut dengan perintah:
   *upch* atau *upsaluran*
   
3. Bot akan secara otomatis mengunggah media yang kamu kirim ke saluran yang telah diatur.

📦 *Tipe Media yang Didukung*:
   - Gambar 🖼️
   - Video 🎥
   - Audio 🎶
   - Dokumen 📄
   - Stiker 🔖

💡 *Contoh Penggunaan*:
   - Kirim gambar, lalu balas dengan perintah:
     *upch*
   - Kirim audio, lalu balas dengan perintah:
     *upsaluran*

Jika berhasil, bot akan menginformasikan bahwa media telah diunggah ke saluran. 😉
            `;
            await reply(usageText);
        };

        // Handling commands
        switch (command) {
            case "upsaluran":
            case "upch": {
                if (isMedia) {
                    reply("Mohon tunggu, proses unggah sedang berlangsung...");
                    const mediaContent = await quoted.download(); // Unduh media
                    if (mediaContent) {
                        await uploadMediaToChannel(quoted.mediaType || mime.split('/')[0], mediaContent); // Upload media ke saluran
                    } else {
                        await reply("⚠️ Gagal mengunduh media, coba lagi.");
                    }
                } else {
                    await reply("⚠️ Tidak ada media yang dikutip untuk diunggah. Balas media yang ingin diunggah dengan perintah *upch*.");
                }
            }
            break;

            case "helpupch":
            case "helpupsaluran": {
                // Memberikan petunjuk penggunaan
                await sendUsageInstructions();
            }
            break;

            case ">": {
                if (!isCreator) return reply("*[System Notice]* Tidak memiliki akses.");
                try {
                    const evaled = await eval(args.join(' '));
                    const output = typeof evaled === 'string' ? evaled : require('util').inspect(evaled);
                    await reply(output);
                } catch (err) {
                    await reply(String(err));
                }
            }
            break;

            default:
                // Handle perintah lainnya jika perlu.
                break;
        }
    } catch (err) {
        console.error(err);
    }
}
