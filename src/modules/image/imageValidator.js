const fs = require('fs');
const path = require('path');
const { LOG_CONFIG } = require('../../config/botConfig');

class Logger {
    constructor() {
        if (!fs.existsSync(LOG_CONFIG.logDir)) {
            fs.mkdirSync(LOG_CONFIG.logDir);
        }
    }

    logMessage(type, content, elapsedTime = null) {
        const timestamp = new Date().toISOString();
        const logMsg = `[${timestamp}] ${type}: ${JSON.stringify(content)}${elapsedTime ? ` | Elapsed Time: ${elapsedTime}` : ''}\n`;
        console.log(logMsg.trim());
        fs.appendFileSync(path.join(LOG_CONFIG.logDir, LOG_CONFIG.logFile), logMsg);
    }
}

module.exports = new Logger();