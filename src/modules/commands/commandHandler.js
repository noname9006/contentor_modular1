const { LOG_EVENTS } = require('../../config/botConfig');
const logger = require('../utils/logger');
const checkCommand = require('./checkCommand');
const hashCommand = require('./hashCommand');
const permissionCommand = require('./permissionCommand');

class CommandHandler {
    async handleCommand(message) {
        const [command, ...args] = message.content.split(' ');

        try {
            switch(command) {
                case '!hash':
                    logger.logMessage(LOG_EVENTS.HASH_COMMAND, { 
                        content: message.content,
                        commandChannelId: message.channel.id 
                    });
                    await hashCommand.execute(message, args);
                    break;

                case '!check':
                    await checkCommand.execute(message, args);
                    break;

                case '!checkperms':
                    await permissionCommand.execute(message, args);
                    break;

                case '!help':
                    await this.sendHelpMessage(message);
                    break;

                default:
                    await message.channel.send('Unknown command. Use !help to see available commands.');
            }
        } catch (error) {
            console.error(`Error executing command ${command}:`, error);
            logger.logMessage('COMMAND_ERROR', { 
                command,
                error: error.message,
                stack: error.stack
            });
            await message.channel.send(`Error executing command: ${error.message}`);
        }
    }

    async sendHelpMessage(message) {
        const helpMessage = `
**Forum Image Analyzer Bot Commands:**
\`!check <channelId>\` - Analyze a forum channel for duplicate images
\`!checkperms <channelId>\` - Check bot permissions in a forum channel
\`!hash <channelId>\` - Build hash database for previous messages in a channel
\`!help\` - Show this help message

**Note:** All responses will be sent to the channel where the command was issued.
`;
        await message.channel.send(helpMessage);
    }
}

module.exports = new CommandHandler();