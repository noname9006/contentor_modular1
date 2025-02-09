const fs = require('fs');
const logger = require('../utils/logger');

class HashDatabase {
    constructor() {
        this.channelHashTables = {};
    }

    loadHashDatabase(channelId) {
        const filePath = `hashtable_${channelId}.json`;
        if (fs.existsSync(filePath)) {
            try {
                console.log(`Loading hash database from ${filePath}`);
                const data = fs.readFileSync(filePath);
                const jsonData = JSON.parse(data);
                console.log(`Successfully loaded ${Object.keys(jsonData).length} entries from hash database`);
                return new Map(Object.entries(jsonData));
            } catch (err) {
                console.error('Error loading hash database:', err);
                logger.logMessage('LOAD_ERROR', { error: err.message });
                return new Map();
            }
        }
        console.log(`No existing hash database found for channel ${channelId}`);
        return new Map();
    }

    saveHashDatabase(channelId, hashDB) {
        const filePath = `hashtable_${channelId}.json`;
        try {
            console.log(`Saving hash database to ${filePath}`);
            const obj = Object.fromEntries(hashDB);
            fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
            console.log(`Successfully saved ${hashDB.size} entries to hash database`);
            this.channelHashTables[channelId] = hashDB;
        } catch (err) {
            console.error('Error saving hash database:', err);
            logger.logMessage('SAVE_ERROR', { error: err.message });
        }
    }

    getOrCreateHashDB(channelId) {
        if (!this.channelHashTables[channelId]) {
            this.channelHashTables[channelId] = this.loadHashDatabase(channelId);
        }
        return this.channelHashTables[channelId];
    }

    addHashEntry(channelId, hash, messageData) {
        const hashDB = this.getOrCreateHashDB(channelId);
        if (!hashDB.has(hash)) {
            hashDB.set(hash, {
                originalMessage: messageData,
                duplicates: []
            });
        }
        this.saveHashDatabase(channelId, hashDB);
        return hashDB.get(hash);
    }

    addDuplicate(channelId, hash, duplicateData) {
        const hashDB = this.getOrCreateHashDB(channelId);
        const entry = hashDB.get(hash);
        if (entry) {
            entry.duplicates.push(duplicateData);
            this.saveHashDatabase(channelId, hashDB);
        }
        return entry;
    }
}

module.exports = new HashDatabase();