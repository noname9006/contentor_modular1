const logger = require('../modules/utils/logger');

class ChannelService {
    async checkChannelPermissions(channel) {
        console.log(`Checking permissions for channel ${channel.id}`);
        if (!channel) {
            throw new Error('Channel object is null or undefined');
        }
        
        if (!channel.isTextBased() && !channel.isThread() && channel.type !== 15) {
            throw new Error('This channel is not a text channel, thread, or forum');
        }
        
        const permissions = channel.permissionsFor(channel.client.user);
        if (!permissions) {
            throw new Error('Cannot check permissions for this channel');
        }
        
        const requiredPermissions = ['ViewChannel', 'ReadMessageHistory', 'SendMessages'];
        const missingPermissions = requiredPermissions.filter(perm => !permissions.has(perm));
        
        if (missingPermissions.length > 0) {
            throw new Error(`Missing required permissions: ${missingPermissions.join(', ')}`);
        }
        
        return true;
    }

    async countTotalMessages(channel) {
        console.log(`Counting messages in channel ${channel.id}`);
        await this.checkChannelPermissions(channel);
        let totalMessages = 0;
        let lastMessageId;
        const batchSize = 100;
        
        try {
            while (true) {
                const options = { limit: batchSize };
                if (lastMessageId) options.before = lastMessageId;
                const messages = await channel.messages.fetch(options);
                if (!messages || messages.size === 0) break;
                totalMessages += messages.size;
                lastMessageId = messages.last()?.id;
                messages.clear();
                if (global.gc) global.gc();
                
                if (totalMessages % 1000 === 0) {
                    console.log(`Counted ${totalMessages} messages so far...`);
                }
            }
            console.log(`Finished counting messages. Total: ${totalMessages}`);
            return totalMessages;
        } catch (error) {
            console.error('Error counting messages:', error);
            throw new Error(`Failed to count messages: ${error.message}`);
        }
    }
}

module.exports = new ChannelService();