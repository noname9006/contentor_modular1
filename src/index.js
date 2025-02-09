const { Client, Events, GatewayIntentBits } = require('discord.js');
const { BOT_INFO, TRACKED_CHANNELS } = require('./config/botConfig');
const logger = require('./modules/utils/logger');
const commandHandler = require('./modules/commands/commandHandler');
const messageProcessor = require('./services/messageProcessor');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith('!')) {
        await commandHandler.handleCommand(message);
        return;
    }

    if (TRACKED_CHANNELS.includes(message.channel.id)) {
        await messageProcessor.processNewMessage(message);
    }
});

client.on(Events.Error, error => {
    console.error('Discord client error:', error);
    logger.logMessage('DISCORD_ERROR', { error: error.message, stack: error.stack });
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
    logger.logMessage('UNHANDLED_REJECTION', { error: error.message, stack: error.stack });
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
    logger.logMessage('UNCAUGHT_EXCEPTION', { error: error.message, stack: error.stack });
    process.exit(1);
});

if (!process.env.DISCORD_BOT_TOKEN) {
    console.error('No Discord bot token found in environment variables!');
    logger.logMessage('STARTUP_ERROR', 'No Discord bot token found in environment variables!');
    process.exit(1);
}

client.login(process.env.DISCORD_BOT_TOKEN)
    .then(() => {
        logger.logMessage('BOT_LOGIN_SUCCESS', {
            username: client.user.tag,
            startTime: BOT_INFO.startTime
        });
        console.log(`Bot is ready! Logged in as ${client.user.tag}`);
    })
    .catch(error => {
        console.error('Failed to log in:', error);
        logger.logMessage('BOT_LOGIN_ERROR', { error: error.message, stack: error.stack });
        process.exit(1);
    });