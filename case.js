require("./config")
const { smsg, getGroupAdmins, sleep } = require('./lib/myfunction')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
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
        const ucapanWaktu = currentHour >= 18 ? "Selamat Malam 🌃" :
                             currentHour >= 15 ? "Selamat Sore 🌄" :
                             currentHour >= 11 ? "Selamat Siang 🏞️" :
                             currentHour >= 6  ? "Selamat Pagi 🏙️"  : "Selamat Subuh 🌆";

        // Fungsi untuk merespon pesan
        const reply = async (teks) => {
            await Kaizen.sendMessage(
                from, { text: teks },
                { quoted: { key: { fromMe: false, participant: `0@s.whatsapp.net` }, message: { 'contactMessage': { 'displayName': `Kaizen` }}} }
            );
        };

        // Fungsi untuk mengirim media ke saluran (channel)
        const uploadMediaToChannel = async (mediaType, mediaContent, customCaption = "") => {
            let options = {};

            // Deteksi dan konfigurasi berdasarkan tipe media
            switch (mediaType) {
                case 'image':
                    options = { image: mediaContent, caption: customCaption || '🖼️ Gambar Berhasil Diunggah!' };
                    break;
                case 'video':
                    options = { video: mediaContent, caption: customCaption || '🎥 Video Berhasil Diunggah!' };
                    break;
                case 'audio':
                    options = { audio: mediaContent, mimetype: 'audio/mp4', ptt: true };
                    break;
                case 'document':
                    options = { document: mediaContent, mimetype: quoted.mimetype, fileName: quoted.fileName || 'Dokumen' };
                    break;
                case 'sticker':
                    options = { sticker: mediaContent };
                    break;
                default:
                    await reply("⚠️ Media yang Anda kirim tidak didukung.");
                    return;
            }

            try {
                await Kaizen.sendMessage(`${global.idch}`, options); // Upload ke channel
                await sleep(2000); // Beri jeda
                await reply("☘️ Media berhasil diunggah ke saluran. Silakan cek.");
            } catch (error) {
                await reply("⚠️ Terjadi kesalahan saat mengunggah media. Coba lagi nanti.");
            }
        };

        // Fungsi untuk memberikan petunjuk penggunaan
        const sendUsageInstructions = async () => {
            const usageText = `
📌 *Cara Menggunakan Perintah UPCH (Upload Channel)*:

1. Kirim media (gambar, video, audio, dokumen, atau stiker) di chat.
2. Setelah mengirim media, balas media tersebut dengan perintah:
   *upch* atau *upsaluran* [optional_caption]

📝 Jika Anda ingin menambahkan caption, tambahkan teks setelah perintah. Misalnya:
   *.upch Ini adalah caption saya*

📦 *Tipe Media yang Didukung*:
   - Gambar 🖼️
   - Video 🎥
   - Audio 🎶
   - Dokumen 📄
   - Stiker 🔖

💡 *Contoh Penggunaan*:
   - Kirim gambar, lalu balas dengan perintah:
     *upch Upload foto berhasil anjay*
   - Kirim audio, lalu balas dengan perintah:
     *upsaluran Audio Berhasil!*

Jika tidak ada caption yang ditambahkan, media akan diunggah tanpa caption. Pastikan Anda membalas media yang ingin diunggah agar perintah berhasil dijalankan.
            `;
            await reply(usageText);
        };

        // Menambahkan deteksi apakah perintah dijalankan tanpa media yang dikutip
        const isQuotedMedia = quoted && isMedia;

        // Handling commands
        switch (command) {
            case "upsaluran":
            case "upch": {
                if (isQuotedMedia) {
                    const customCaption = args.join(" "); // Mengambil caption dari teks setelah perintah
                    reply("🔄 Media sedang diunggah, harap tunggu...");
                    const mediaContent = await quoted.download(); // Unduh media
                    if (mediaContent) {
                        await uploadMediaToChannel(quoted.mediaType || mime.split('/')[0], mediaContent, customCaption); // Upload media dengan caption custom
                    } else {
                        await reply("⚠️ Gagal mengunduh media. Coba lagi atau pastikan media valid.");
                    }
                } else {
                    await reply("⚠️ Tidak ada media yang dikutip. Pastikan Anda membalas media yang ingin diunggah dengan perintah *upch*.");
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
                if (!isCreator) return reply("🚫 Anda tidak memiliki akses ke perintah ini.");
                try {
                    const evaled = await eval(args.join(' '));
                    const output = typeof evaled === 'string' ? evaled : require('util').inspect(evaled);
                    await reply(output);
                } catch (err) {
                    await reply(`⚠️ Kesalahan saat menjalankan perintah:\n\n${String(err)}`);
                }
            }
            break;

            default:
    // Tambahkan penanganan untuk perintah lainnya jika perlu
    if (isCmd && !isQuotedMedia) {
        // Tidak ada respons jika perintah tidak valid
        // Atau bisa dibiarkan kosong agar tidak terjadi apa-apa saat perintah tidak dikenali
    }
    break;
        }
    } catch (err) {
        console.error("⚠️ Terjadi kesalahan:", err);
        reply("⚠️ Terjadi kesalahan yang tidak terduga. Silakan coba lagi.");
    }
}
