require('dotenv').config();

const BOT_INFO = {
    startTime: new Date().toISOString().replace('T', ' ').split('.')[0],
    memoryLimit: 8000 // MB
};

const LOG_CONFIG = {
    logDir: 'logs',
    logFile: `bot_log_${new Date().toISOString().split('T')[0]}.log`
};

const LOG_EVENTS = {
    HASH_COMMAND: 'HASH_COMMAND_RECEIVED',
    HASH_START: 'HASH_CREATION_START',
    HASH_PROGRESS: 'HASH_CREATION_PROGRESS',
    HASH_FINISH: 'HASH_CREATION_FINISH',
    HASH_EXPORT: 'HASH_EXPORT',
    NEW_IMAGE: 'NEW_IMAGE_DETECTED',
    NEW_HASH: 'NEW_HASH_CREATED',
    HASH_COMPARED: 'HASH_COMPARED',
    DUPLICATE_FOUND: 'DUPLICATE_FOUND',
    IMAGE_ERROR: 'IMAGE_PROCESSING_ERROR',
    VALIDATION_ERROR: 'IMAGE_VALIDATION_ERROR',
    BOT_STATUS: 'BOT_STATUS_UPDATE',
    DEBUG: 'DEBUG_INFO'
};

const TRACKED_CHANNELS = process.env.TRACKED_CHANNELS 
    ? process.env.TRACKED_CHANNELS.split(',').map(channelId => channelId.trim())
    : [];

module.exports = {
    BOT_INFO,
    LOG_CONFIG,
    LOG_EVENTS,
    TRACKED_CHANNELS
};