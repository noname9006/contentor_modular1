const { EmbedBuilder } = require('discord.js');
const hashDatabase = require('../modules/database/hashDatabase');
const { getImageHash } = require('../modules/image/hashProcessor');
const { isSupportedImage } = require('../modules/image/imageValidator');
const logger = require('../modules/utils/logger');
const { LOG_EVENTS } = require('../config/botConfig');

class MessageProcessor {
    async processNewMessage(message) {
        const attachments = [...message.attachments.values()];
        const containsImage = attachments.some(att => att.contentType?.startsWith('image/'));
        
        if (!containsImage) return;

        console.log(`Processing new message with images in channel ${message.channel.id}`);
        
        for (const attachment of attachments) {
            if (!isSupportedImage(attachment)) continue;

            try {
                const hash = await getImageHash(attachment.url);
                const messageData = this.createMessageData(message);
                const entry = hashDatabase.addHashEntry(message.channel.id, hash, messageData);
                
                if (entry.originalMessage.id !== message.id) {
                    const duplicateData = this.createMessageData(message);
                    hashDatabase.addDuplicate(message.channel.id, hash, duplicateData);
                    
                    const isSelfRepost = entry.originalMessage.author.id === message.author.id;
                    await this.sendDuplicateNotification(message, entry, isSelfRepost);
                }
            } catch (err) {
                console.error('Error processing image:', err);
                logger.logMessage(LOG_EVENTS.IMAGE_ERROR, {
                    messageId: message.id,
                    attachmentUrl: attachment.url,
                    error: err.message
                });
            }
        }
    }

    createMessageData(message) {
        return {
            id: message.id,
            url: message.url,
            author: {
                username: message.author.username,
                id: message.author.id
            },
            timestamp: message.createdTimestamp,
            channelId: message.channel.id
        };
    }

    async sendDuplicateNotification(message, entry, isSelfRepost) {
        const embed = new EmbedBuilder()
            .setTitle(isSelfRepost ? 'SELF-REPOST' : 'DUPE')
            .setDescription(`[Original message](${entry.originalMessage.url})`)
            .setColor(isSelfRepost ? 0xFFA500 : 0xFF0000)
            .setTimestamp();
        
        try {
            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Failed to send duplicate notification:', error);
        }
    }
}

module.exports = new MessageProcessor();