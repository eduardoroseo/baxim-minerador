const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const chat_id = process.env.BOT_CHAT_ID;

const telegram = {
    sendMessage: async (message) => {
        return bot.telegram.sendMessage(chat_id, message);
    },

    sendImage: async (image) => {
        console.log(chat_id);
        return bot.telegram.sendPhoto(chat_id, "subtitle", image);
    }
}

module.exports = telegram;