const channelService = require('../../services/channelService');
const reportGenerator = require('../database/reportGenerator');
const timeFormatter = require('../utils/timeFormatter');
const progressBar = require('../utils/progressBar');
const logger = require('../utils/logger');
const hashDatabase = require('../database/hashDatabase');
const { getImageHash } = require('../image/hashProcessor');
const { isSupportedImage } = require('../image/imageValidator');

class CheckCommand {
    async execute(message, args) {
        const channelId = args[0];
        if (!this.validateChannelId(channelId)) {
            return message.channel.send('Please provide a valid forum channel ID. Usage: !check <channelId>');
        }

        let statusMessage = null;
        const commandStartTime = Date.now();

        try {
            const channel = await this.getAndValidateChannel(message.client, channelId);
            statusMessage = await message.channel.send('Starting forum analysis... This might take a while.');

            const { activePosts, archivedPosts } = await this.getAllForumPosts(channel);
            const allPosts = [...activePosts, ...archivedPosts];
            
            const totalMessages = await this.countTotalMessages(allPosts);
            await statusMessage.edit(
                `Starting analysis of ${totalMessages.toLocaleString()} total messages across ${allPosts.length} forum posts...`
            );

            const results = await this.processForumPosts(allPosts, statusMessage, totalMessages);
            const finalStats = await this.generateFinalReport(channelId, results, commandStartTime);
            await this.sendFinalStatus(statusMessage, finalStats);

        } catch (error) {
            console.error('Error in check command:', error);
            const errorMessage = `An error occurred: ${error.message}`;
            await this.updateStatus(statusMessage, errorMessage, message.channel);
        }
    }

    validateChannelId(channelId) {
        return channelId && channelId.match(/^\d+$/);
    }

    async getAndValidateChannel(client, channelId) {
        const channel = await client.channels.fetch(channelId);
        if (!channel) throw new Error('Channel not found');
        if (channel.type !== 15) throw new Error('This channel is not a forum channel');
        await channelService.checkChannelPermissions(channel);
        return channel;
    }

    async getAllForumPosts(channel) {
        console.log('Fetching forum posts...');
        const activePosts = await channel.threads.fetchActive();
        const archivedPosts = await channel.threads.fetchArchived();
        console.log(`Found ${activePosts.threads.size} active and ${archivedPosts.threads.size} archived posts`);
        return {
            activePosts: Array.from(activePosts.threads.values()),
            archivedPosts: Array.from(archivedPosts.threads.values())
        };
    }

    async countTotalMessages(posts) {
        let total = 0;
        for (const post of posts) {
            total += await channelService.countTotalMessages(post);
        }
        return total;
    }

    async processForumPosts(posts, statusMessage, totalMessages) {
        const imageDatabase = new Map();
        let processedMessages = 0;
        let processedImages = 0;
        let duplicatesFound = 0;
        const startTime = Date.now();

        for (const post of posts) {
            console.log(`Processing post: ${post.name}`);
            const postResults = await this.processPost(post, imageDatabase);
            
            processedMessages += postResults.processedMessages;
            processedImages += postResults.processedImages;
            duplicatesFound += postResults.duplicatesFound;

            await this.updateProgressStatus(
                statusMessage,
                posts.indexOf(post) + 1,
                posts.length,
                processedMessages,
                totalMessages,
                processedImages,
                duplicatesFound,
                startTime,
                post.name
            );
        }

        return {
            imageDatabase,
            processedMessages,
            processedImages,
            duplicatesFound
        };
    }

    async processPost(post, imageDatabase) {
        let processedMessages = 0;
        let processedImages = 0;
        let duplicatesFound = 0;
        let lastMessageId;

        while (true) {
            const messages = await post.messages.fetch({ 
                limit: 100,
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
                        if (imageDatabase.has(hash)) {
                            duplicatesFound++;
                            imageDatabase.get(hash).duplicates.push(this.createMessageData(msg));
                        } else {
                            imageDatabase.set(hash, {
                                originalMessage: this.createMessageData(msg),
                                duplicates: []
                            });
                        }
                    } catch (error) {
                        logger.logMessage('IMAGE_ERROR', {
                            messageId: msg.id,
                            error: error.message
                        });
                    }
                }
            }

            lastMessageId = messages.last()?.id;
            if (global.gc) global.gc();
        }

        return { processedMessages, processedImages, duplicatesFound };
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
            location: `forum-post-${message.channel.name}`
        };
    }

    async updateProgressStatus(
        statusMessage,
        currentPost,
        totalPosts,
        processedMessages,
        totalMessages,
        processedImages,
        duplicatesFound,
        startTime,
        currentPostName
    ) {
        const elapsedTime = timeFormatter.formatElapsedTime((Date.now() - startTime) / 1000);
        const statusText = progressBar.createProgressUpdate({
            current: currentPost,
            total: totalPosts,
            processedImages,
            duplicatesFound,
            elapsedTime,
            currentItem: currentPostName,
            additionalInfo: `Messages: ${processedMessages.toLocaleString()}/${totalMessages.toLocaleString()}`
        });

        try {
            await statusMessage.edit(statusText);
        } catch (error) {
            console.error('Failed to update status message:', error);
        }
    }

    async generateFinalReport(channelId, results, startTime) {
        const reportFile = await reportGenerator.generateReport(channelId, results.imageDatabase);
        const elapsedTime = timeFormatter.formatElapsedTime((Date.now() - startTime) / 1000);

        return {
            reportFile,
            stats: {
                totalMessages: results.processedMessages,
                processedImages: results.processedImages,
                duplicatesFound: results.duplicatesFound,
                elapsedTime,
                memoryUsed: `${process.memoryUsage().heapUsed / 1024 / 1024}MB`
            }
        };
    }

    async sendFinalStatus(statusMessage, finalStats) {
        const finalMessage = {
            content: 
                `Analysis complete!\n` +
                `Total messages analyzed: ${finalStats.stats.totalMessages.toLocaleString()}\n` +
                `Images found: ${finalStats.stats.processedImages.toLocaleString()}\n` +
                `Duplicates found: ${finalStats.stats.duplicatesFound.toLocaleString()}\n` +
                `Time taken: ${finalStats.stats.elapsedTime}\n` +
                `Memory used: ${finalStats.stats.memoryUsed}\n` +
                `Report saved as: ${finalStats.reportFile}`,
            files: [finalStats.reportFile]
        };

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

module.exports = new CheckCommand();