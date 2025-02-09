const { imageHash } = require('image-hash');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const { pipeline } = require('stream');
const logger = require('../utils/logger');

const imageHashAsync = promisify(imageHash);
const pipelineAsync = promisify(pipeline);
const unlinkAsync = promisify(fs.unlink);

async function getImageHash(url) {
    const tmpdir = os.tmpdir();
    const tmpfile = path.join(tmpdir, `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    
    try {
        console.log(`Downloading image from ${url}`);
        await new Promise((resolve, reject) => {
            const file = fs.createWriteStream(tmpfile);
            https.get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download image: ${response.statusCode}`));
                    return;
                }
                pipeline(response, file, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            }).on('error', reject);
        });

        console.log('Calculating image hash...');
        const hash = await imageHashAsync(tmpfile, 16, true);
        console.log('Image hash calculated successfully');
        return hash;
    } catch (error) {
        console.error('Error processing image:', error);
        throw new Error(`Failed to process image: ${error.message}`);
    } finally {
        try {
            await unlinkAsync(tmpfile);
            console.log('Temporary file cleaned up');
        } catch (error) {
            console.error('Failed to clean up temporary file:', error);
        }
    }
}

module.exports = {
    getImageHash
};