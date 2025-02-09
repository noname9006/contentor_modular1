const channelService = require('../../services/channelService');
const logger = require('../utils/logger');
const { PERMISSIONS, STATUS } = require('../../config/constants');
const { EmbedBuilder } = require('discord.js');

class PermissionCommand {
    async execute(message, args) {
        const channelId = args[0];
        if (!this.validateChannelId(channelId)) {
            return message.channel.send('Please provide a channel ID. Usage: !checkperms <channelId>');
        }

        try {
            const channel = await this.fetchChannel(message.client, channelId);
            const permissionResults = await this.checkChannelPermissions(channel);
            await this.sendPermissionReport(message.channel, channel, permissionResults);
        } catch (error) {
            console.error('Permission check error:', error);
            logger.logMessage('PERMISSION_CHECK_ERROR', {
                channelId,
                error: error.message
            });
            await message.channel.send(`Error checking permissions: ${error.message}`);
        }
    }

    validateChannelId(channelId) {
        return channelId && channelId.match(/^\d+$/);
    }

    async fetchChannel(client, channelId) {
        const channel = await client.channels.fetch(channelId);
        if (!channel) {
            throw new Error('Channel not found');
        }
        return channel;
    }

    async checkChannelPermissions(channel) {
        const permissions = channel.permissionsFor(channel.client.user);
        if (!permissions) {
            throw new Error('Cannot check permissions for this channel');
        }

        const results = {
            required: {},
            additional: {},
            channelType: this.getChannelType(channel),
            hasRequiredPermissions: true
        };

        // Check required permissions
        for (const perm of PERMISSIONS.REQUIRED) {
            const has = permissions.has(perm);
            results.required[perm] = has;
            if (!has) results.hasRequiredPermissions = false;
        }

        // Check additional useful permissions
        const additionalPerms = ['MANAGE_MESSAGES', 'ATTACH_FILES', 'EMBED_LINKS'];
        for (const perm of additionalPerms) {
            results.additional[perm] = permissions.has(perm);
        }

        return results;
    }

    getChannelType(channel) {
        if (channel.isThread()) return 'Thread';
        if (channel.type === 15) return 'Forum';
        if (channel.isTextBased()) return 'Text';
        return 'Unknown';
    }

    async sendPermissionReport(responseChannel, checkedChannel, results) {
        const embed = new EmbedBuilder()
            .setTitle('Channel Permissions Report')
            .setColor(results.hasRequiredPermissions ? STATUS.COLORS.SUCCESS : STATUS.COLORS.ERROR)
            .addFields(
                {
                    name: 'Channel Information',
                    value: `Name: ${checkedChannel.name}\nID: ${checkedChannel.id}\nType: ${results.channelType}`
                },
                {
                    name: 'Required Permissions',
                    value: this.formatPermissions(results.required)
                },
                {
                    name: 'Additional Permissions',
                    value: this.formatPermissions(results.additional)
                }
            )
            .setTimestamp();

        if (!results.hasRequiredPermissions) {
            embed.setDescription('⚠️ Missing required permissions! The bot may not function correctly.');
        }

        try {
            await responseChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Failed to send permission report:', error);
            // Fallback to plain text if embed fails
            const plainTextReport = this.createPlainTextReport(checkedChannel, results);
            await responseChannel.send(plainTextReport);
        }
    }

    formatPermissions(permissions) {
        return Object.entries(permissions)
            .map(([perm, has]) => `${has ? '✅' : '❌'} ${perm}`)
            .join('\n');
    }

    createPlainTextReport(channel, results) {
        return [
            '**Channel Permissions Report**',
            '',
            `Channel: ${channel.name} (${channel.id})`,
            `Type: ${results.channelType}`,
            '',
            'Required Permissions:',
            this.formatPermissions(results.required),
            '',
            'Additional Permissions:',
            this.formatPermissions(results.additional)
        ].join('\n');
    }
}

module.exports = new PermissionCommand();