const channelService = require('../../services/channelService');
const hashDatabase = require('../database/hashDatabase');
const { getImageHash } = require('../image/hashProcessor');
const { isSupportedImage } = require('../image/imageValidator');
const logger = require('../utils/logger');
const timeFormatter = require('../utils/timeFormatter');
const progressBar = require('../utils/progressBar');
const { LOG_EVENTS, PROCESSING, STATUS } = require('../../config/constants');

class HashCommand {
    async execute(message, args) {
        const channelId = args[0];
        if (!this.validateChannelId(channelId)) {
            return message.channel.send('Please provide a channel ID. Usage: !hash <channel_id>');
        }

        let statusMessage = null;
        const commandStartTime = Date.now();

        try {
            // Validate and fetch channel
            const channel = await this.getAndValidateChannel(message.client, channelId);
            
            // Initialize status message
            statusMessage = await message.channel.send('Starting hash database build... This might take a while.');
            
            // Count total messages for progress tracking
            const totalMessages = await channelService.countTotalMessages(channel);
            await statusMessage.edit(`Starting hash database build...\nTotal messages to process: ${totalMessages.toLocaleString()}`);

            // Build hash database
            const hashDB = await this.buildHashDatabase(
                channel,
                totalMessages,
                statusMessage,
                commandStartTime
            );

            // Save results
            hashDatabase.saveHashDatabase(channelId, hashDB);

            // Send final status
            const finalStats = this.calculateFinalStats(hashDB, commandStartTime);
            await this.sendFinalStatus(statusMessage, finalStats);

        } catch (error) {
            console.error('Hash command error:', error);
            logger.logMessage('HASH_COMMAND_ERROR', { 
                channelId,
                error: error.message,
                stack: error.stack
            });
            await this.updateStatus(statusMessage, `Error: ${error.message}`, message.channel);
        }
    }

    validateChannelId(channelId) {
        return channelId && channelId.match(/^\d+$/);
    }

    async getAndValidateChannel(client, channelId) {
        try {
            const channel = await client.channels.fetch(channelId);
            if (!channel) throw new Error('Channel not found');
            await channelService.checkChannelPermissions(channel);
            return channel;
        } catch (error) {
            throw new Error(`Failed to access channel: ${error.message}`);
        }
    }

    async buildHashDatabase(channel, totalMessages, statusMessage, startTime) {
        const hashDB = new Map();
        let processedMessages = 0;
        let processedImages = 0;
        let lastMessageId;

        while (true) {
            try {
                const messages = await channel.messages.fetch({ 
                    limit: PROCESSING.BATCH_SIZE,
                    ...(lastMessageId && { before: lastMessageId })
                });

                if (messages.size === 0) break;

                for (const msg of messages.values()) {
                    processedMessages++;
                    const attachments = [...msg.attachments.values()];

                    for (const attachment of attachments) {
                        if (!isSupportedImage(attachment)) continue;

                        processedImages++;
                        try {
                            const hash = await getImageHash(attachment.url);
                            if (!hashDB.has(hash)) {
                                hashDB.set(hash, {
                                    originalMessage: this.createMessageData(msg),
                                    duplicates: []
                                });
                            }
                        } catch (err) {
                            logger.logMessage(LOG_EVENTS.IMAGE_ERROR, {
                                messageId: msg.id,
                                attachmentUrl: attachment.url,
                                error: err.message
                            });
                        }
                    }

                    // Update progress periodically
                    if (processedMessages % 100 === 0 || processedMessages === totalMessages) {
                        await this.updateProgress(
                            statusMessage,
                            processedMessages,
                            totalMessages,
                            processedImages,
                            hashDB.size,
                            startTime
                        );
                    }
                }

                lastMessageId = messages.last().id;
                messages.clear();

                // Memory management
                if (global.gc && processedMessages % 1000 === 0) {
                    global.gc();
                }

            } catch (error) {
                logger.logMessage('HASH_PROCESSING_ERROR', {
                    processedMessages,
                    error: error.message
                });
                // Continue with next batch despite errors
                continue;
            }
        }

        return hashDB;
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

    async updateProgress(statusMessage, processedMessages, totalMessages, processedImages, uniqueImages, startTime) {
        const progress = processedMessages / totalMessages;
        const elapsedTime = timeFormatter.formatElapsedTime((Date.now() - startTime) / 1000);
        
        const statusText = progressBar.createProgressUpdate({
            current: processedMessages,
            total: totalMessages,
            processedImages,
            duplicatesFound: processedImages - uniqueImages,
            elapsedTime,
            additionalInfo: `Unique images: ${uniqueImages.toLocaleString()}`
        });

        try {
            await statusMessage.edit(statusText);
        } catch (error) {
            console.error('Failed to update status message:', error);
        }
    }

    calculateFinalStats(hashDB, startTime) {
        const elapsedTime = timeFormatter.formatElapsedTime((Date.now() - startTime) / 1000);
        return {
            uniqueImages: hashDB.size,
            memoryUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
            elapsedTime
        };
    }

    async sendFinalStatus(statusMessage, stats) {
        const finalMessage = 
            `Hash database build complete!\n` +
            `Unique images found: ${stats.uniqueImages.toLocaleString()}\n` +
            `Memory used: ${stats.memoryUsed}\n` +
            `Time taken: ${stats.elapsedTime}`;

        try {
            await statusMessage.edit(finalMessage);
        } catch (error) {
            console.error('Failed to send final status:', error);
            try {
                await statusMessage.channel.send(finalMessage);
            } catch (sendError) {
                console.error('Failed to send alternative final message:', sendError);
            }
        }
    }

    async updateStatus(statusMessage, content, channel) {
        try {
            if (statusMessage) {
                await statusMessage.edit(content);
            } else {
                await channel.send(content);
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    }
}

module.exports = new HashCommand();