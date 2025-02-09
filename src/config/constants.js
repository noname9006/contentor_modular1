/**
 * Application-wide constants for the Discord Image Hash Bot
 */

// Bot operation modes
const BOT_MODES = {
    NORMAL: 'normal',
    DEBUG: 'debug',
    MAINTENANCE: 'maintenance'
};

// Message processing constants
const PROCESSING = {
    BATCH_SIZE: 100,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // milliseconds
    MAX_CONCURRENT_OPERATIONS: 3,
    MEMORY_THRESHOLD: 0.8, // 80% of memory limit
    MESSAGE_CHUNK_SIZE: 1000 // messages to process before progress update
};

// Time constants (in milliseconds)
const TIME = {
    STATUS_UPDATE_INTERVAL: 5000,
    SAVE_INTERVAL: 300000, // 5 minutes
    MAX_PROCESSING_TIME: 7200000, // 2 hours
    COOLDOWN: 60000 // 1 minute
};

// Image processing constants
const IMAGE = {
    HASH_SIZE: 16,
    SUPPORTED_TYPES: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/tiff',
        'image/bmp'
    ],
    EXCLUDED_TYPES: [
        'image/gif'
    ],
    MAX_FILE_SIZE: 8388608 // 8MB
};

// Command prefixes and names
const COMMANDS = {
    PREFIX: '!',
    CHECK: 'check',
    HASH: 'hash',
    CHECKPERMS: 'checkperms',
    HELP: 'help'
};

// Permission levels
const PERMISSIONS = {
    ADMIN: 'ADMINISTRATOR',
    MODERATOR: 'MANAGE_MESSAGES',
    USER: 'SEND_MESSAGES',
    REQUIRED: [
        'VIEW_CHANNEL',
        'READ_MESSAGE_HISTORY',
        'SEND_MESSAGES'
    ]
};

// File paths and names
const FILES = {
    LOG_DIR: 'logs',
    DATABASE_DIR: 'database',
    REPORTS_DIR: 'reports',
    TEMP_DIR: 'temp',
    CONFIG_FILE: 'config.json',
    LOG_FILE_PREFIX: 'bot_log_',
    HASH_FILE_PREFIX: 'hashtable_',
    REPORT_FILE_PREFIX: 'report_'
};

// Status messages and colors
const STATUS = {
    COLORS: {
        SUCCESS: 0x00FF00,
        WARNING: 0xFFA500,
        ERROR: 0xFF0000,
        INFO: 0x0099FF,
        DUPLICATE: 0xFF0000,
        SELF_REPOST: 0xFFA500
    },
    MESSAGES: {
        STARTUP: 'Bot is starting up...',
        READY: 'Bot is ready!',
        PROCESSING: 'Processing...',
        COMPLETED: 'Operation completed!',
        ERROR: 'An error occurred:',
        MAINTENANCE: 'Bot is in maintenance mode'
    }
};

// Progress bar configuration
const PROGRESS_BAR = {
    LENGTH: 20,
    FILLED: '█',
    EMPTY: '░'
};

// Report generation
const REPORT = {
    FORMATS: {
        CSV: 'csv',
        JSON: 'json'
    },
    HEADERS: {
        FORUM_ANALYSIS: [
            'Original Post URL',
            'Original Poster',
            'Original Location',
            'Upload Date',
            'Number of Duplicates',
            'Users Who Reposted',
            'Locations of Reposts',
            'Stolen Reposts',
            'Self-Reposts'
        ]
    }
};

// Memory management
const MEMORY = {
    LIMIT: 8000, // MB
    GC_THRESHOLD: 0.7, // 70% of limit
    WARNING_THRESHOLD: 0.8 // 80% of limit
};

// Environment-specific constants
const ENV = {
    PROD: 'production',
    DEV: 'development',
    TEST: 'test'
};

// Date formats
const DATE_FORMATS = {
    LOG: 'YYYY-MM-DD HH:mm:ss',
    FILENAME: 'YYYY-MM-DD',
    REPORT: 'YYYY-MM-DD HH:mm:ss UTC'
};

module.exports = {
    BOT_MODES,
    PROCESSING,
    TIME,
    IMAGE,
    COMMANDS,
    PERMISSIONS,
    FILES,
    STATUS,
    PROGRESS_BAR,
    REPORT,
    MEMORY,
    ENV,
    DATE_FORMATS
};