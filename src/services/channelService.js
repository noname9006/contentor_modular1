const { PERMISSIONS } = require('../config/constants');
const logger = require('../modules/utils/logger');

class ChannelService {
    async checkChannelPermissions(channel) {
        try {
            const botMember = channel.guild.members.cache.get(channel.client.user.id);
            
            // Create a single permissions check
            const missingPermissions = PERMISSIONS.REQUIRED.filter(permission => 
                !botMember.permissionsIn(channel).has(permission)
            );

            if (missingPermissions.length > 0) {
                const missingPermsNames = missingPermissions.map(perm => 
                    Object.entries(PermissionFlagsBits)
                        .find(([key, value]) => value === perm)?.[0] || 'Unknown'
                );
                throw new Error(`Missing required permissions: ${missingPermsNames.join(', ')}`);
            }

            return true;
        } catch (error) {
            logger.logMessage('PERMISSION_CHECK_ERROR', {
                channelId: channel.id,
                error: error.message
            });
            throw new Error(`Permission check failed: ${error.message}`);
        }
    }

    async countTotalMessages(channel) {
        try {
            let total = 0;
            let lastId;

            while (true) {
                const messages = await channel.messages.fetch({
                    limit: 100,
                    ...(lastId && { before: lastId })
                });

                if (messages.size === 0) break;
                
                total += messages.size;
                lastId = messages.last().id;
            }

            return total;
        } catch (error) {
            logger.logMessage('MESSAGE_COUNT_ERROR', {
                channelId: channel.id,
                error: error.message
            });
            throw new Error(`Failed to count messages: ${error.message}`);
        }
    }
}

module.exports = new ChannelService();