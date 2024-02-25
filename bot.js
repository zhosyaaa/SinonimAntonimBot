const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const cheerio = require('cheerio');

const token = '6711701677:AAHfJw56QGNi0MNw-gE4YNGNS1ZcfHqLY1M';
let awaitingSynonymInput = {};
let awaitingAntonymInput = {};
const bot = new TelegramBot(token, { polling: true });

async function getAntonyms(word) {
    try {
        const response = await axios.get(`https://sinonim.org/a/${encodeURIComponent(word)}`);
        const $ = cheerio.load(response.data);
        const parsedData = [];
        const rows = $('table#mainTable tbody tr');
        for (let i = 0; i < rows.length; i++) {
            const row = rows.eq(i);
            const antonim = row.find('td:nth-child(2) a').text().trim();
                if (antonim !== "") {
                parsedData.push({
                    antonim
                });
            }
        }
        return parsedData;
    } catch (error) {
        console.error(error);
        return [];
    }
}

async function getSynonyms(word) {
    try {
        const response = await axios.get(`https://sinonim.org/s/${encodeURIComponent(word)}`);
        const $ = cheerio.load(response.data);
        const parsedData = [];        
        const rows = $('table#mainTable tbody tr');
        for (let i = 0; i < rows.length; i++) {
            const row = rows.eq(i);
            const synonym = row.find('td:nth-child(2) a').text().trim();
                if (synonym !== "") {
                parsedData.push({
                    synonym
                });
            }
        }
        return parsedData;


    } catch (error) {
        console.error(error);
        return [];
    }
}
bot.onText(/Синонимы/, (msg) => {
    const chatId = msg.chat.id;
    awaitingSynonymInput[chatId] = true;
    bot.sendMessage(chatId, 'Напишите слово для поиска синонимов:');
});
bot.onText(/Антонимы/, (msg) => {
    const chatId = msg.chat.id;
    awaitingAntonymInput[chatId] = true;
    bot.sendMessage(chatId, 'Напишите слово для поиска антонимов:');
});
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    if (!text.startsWith('/')) {
        if (awaitingSynonymInput[chatId]) {
            delete awaitingSynonymInput[chatId]; 
            try {
                const synonyms = await getSynonyms(text);
                if (synonyms.length > 0) {
                    let synonymText = synonyms.map(obj => obj.synonym).join(', ');
                    let synonymArray = synonymText.split(' ');
                    synonymText = synonymArray.slice(0, 20).join(' ');                    bot.sendMessage(chatId, `Синонимы для слова "${text}": ${synonymText}`);
                } else {
                    bot.sendMessage(chatId, `Не удалось найти синонимы для слова "${text}".`);
                }
            } catch (error) {
                console.error(error);
                bot.sendMessage(chatId, 'Произошла ошибка при поиске синонимов.');
            }
        }

        if (awaitingAntonymInput[chatId]) {
            delete awaitingAntonymInput[chatId]; 
            try {
                const antonyms = await getAntonyms(text);
                console.log(antonyms)
                if (antonyms.length > 0) {
                    let antonimText = antonyms.map(obj => obj.antonim).join(', ');
                    let antonimArray = antonimText.split(' ');
                    antonimText = antonimArray.slice(0, 20).join(' ');
                    bot.sendMessage(chatId, `Антонимы для слова "${text}": ${antonimText}`);
                } else {
                    bot.sendMessage(chatId, `Не удалось найти антонимы для слова "${text}".`);
                }
            } catch (error) {
                console.error(error);
                bot.sendMessage(chatId, 'Произошла ошибка при поиске антонимов.');
            }
        }
    }
});

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    const keyboard = {
        reply_markup: JSON.stringify({
            keyboard: [
                [{ text: 'Синонимы' }, { text: 'Антонимы' }]
            ],
            resize_keyboard: true
        })
    };
    bot.sendMessage(chatId, 'Выберите действие:', keyboard);
});
