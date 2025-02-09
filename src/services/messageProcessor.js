const { IMAGE } = require('../config/constants');
const { getImageHash } = require('../modules/image/hashProcessor');
const { isSupportedImage } = require('../modules/image/imageValidator');
const hashDatabase = require('../modules/database/hashDatabase');
const logger = require('../modules/utils/logger');

class MessageProcessor {
    async processNewMessage(message) {
        try {
            if (!message.attachments.size) return;

            for (const attachment of message.attachments.values()) {
                await this.processAttachment(message, attachment);
            }
        } catch (error) {
            console.error('Error processing message:', error);
            logger.logMessage('MESSAGE_PROCESSING_ERROR', {
                messageId: message.id,
                error: error.message,
                stack: error.stack
            });
        }
    }

    async processAttachment(message, attachment) {
        try {
            if (!isSupportedImage(attachment)) return;

            if (attachment.size > IMAGE.MAX_FILE_SIZE) {
                logger.logMessage('IMAGE_SIZE_ERROR', {
                    messageId: message.id,
                    attachmentUrl: attachment.url,
                    size: attachment.size
                });
                return;
            }

            const hash = await getImageHash(attachment.url);
            const existingEntry = hashDatabase.getHashEntry(message.channel.id, hash);

            if (existingEntry) {
                await this.handleDuplicate(message, existingEntry, attachment);
            } else {
                await this.handleNewImage(message, hash, attachment);
            }

        } catch (error) {
            logger.logMessage('ATTACHMENT_PROCESSING_ERROR', {
                messageId: message.id,
                attachmentUrl: attachment.url,
                error: error.message
            });
        }
    }

    async handleDuplicate(message, existingEntry, attachment) {
        const isDifferentAuthor = existingEntry.originalMessage.author.id !== message.author.id;
        
        logger.logMessage('DUPLICATE_FOUND', {
            originalMessageId: existingEntry.originalMessage.id,
            duplicateMessageId: message.id,
            channelId: message.channel.id,
            isDifferentAuthor
        });

        const duplicateData = {
            id: message.id,
            url: message.url,
            author: {
                username: message.author.username,
                id: message.author.id
            },
            timestamp: message.createdTimestamp,
            channelId: message.channel.id
        };

        hashDatabase.addDuplicate(message.channel.id, existingEntry.hash, duplicateData);
    }

    async handleNewImage(message, hash, attachment) {
        const messageData = {
            id: message.id,
            url: message.url,
            author: {
                username: message.author.username,
                id: message.author.id
            },
            timestamp: message.createdTimestamp,
            channelId: message.channel.id
        };

        hashDatabase.addNewHash(message.channel.id, hash, messageData);

        logger.logMessage('NEW_IMAGE_ADDED', {
            messageId: message.id,
            channelId: message.channel.id,
            hash
        });
    }
}

module.exports = new MessageProcessor();