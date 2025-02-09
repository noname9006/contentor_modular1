const fs = require('fs');
const timeFormatter = require('../utils/timeFormatter');
const logger = require('../utils/logger');

class ReportGenerator {
    generateAuthorReport(channelId, authorStats) {
        console.log(`Generating author report for channel ${channelId}`);
        const fileName = `author_report_${channelId}_${Date.now()}.csv`;
        
        const headers = [
            'Username',
            'Total Reposts',
            'Self Reposts',
            'Stolen Reposts',
            'Times Been Reposted',
            'Repost Ratio'
        ].join(',') + '\n';
        
        const lines = [];
        for (const [authorId, stats] of authorStats.entries()) {
            const repostRatio = stats.totalReposts > 0 
                ? (stats.stolenReposts / stats.totalReposts).toFixed(2) 
                : '0.00';
                
            lines.push([
                stats.username,
                stats.totalReposts,
                stats.selfReposts,
                stats.stolenReposts,
                stats.victimOf,
                repostRatio
            ].join(','));
        }
        
        fs.writeFileSync(fileName, headers + lines.join('\n'));
        console.log(`Author report generated successfully: ${fileName}`);
        return fileName;
    }

    async generateReport(channelId, imageDatabase) {
        console.log(`Generating report for channel ${channelId}`);
        const fileName = `duplicate_report_${channelId}_${Date.now()}.csv`;
        const writeStream = fs.createWriteStream(fileName);
        
        writeStream.write(
            `# Forum Analysis Report\n` +
            `# Channel ID: ${channelId}\n` +
            `# Analysis performed at: ${timeFormatter.getCurrentFormattedTime()} UTC\n\n` +
            'Original Post URL,Original Poster,Original Location,Upload Date,Number of Duplicates,Users Who Reposted,Locations of Reposts,Stolen Reposts,Self-Reposts\n'
        );

        for (const [hash, imageInfo] of imageDatabase.entries()) {
            const allPosters = [imageInfo.originalMessage, ...imageInfo.duplicates];
            allPosters.sort((a, b) => a.timestamp - b.timestamp);
            const originalPoster = allPosters[0];
            const reposts = allPosters.slice(1);
            
            const [stolenCount, selfRepostCount] = this.countRepostTypes(reposts, originalPoster);
            const line = this.formatReportLine(originalPoster, reposts, stolenCount, selfRepostCount);
            writeStream.write(line);
        }

        await new Promise(resolve => writeStream.end(resolve));
        console.log(`Report generated successfully: ${fileName}`);
        return fileName;
    }

    countRepostTypes(reposts, originalPoster) {
        let stolenCount = 0;
        let selfRepostCount = 0;
        
        for (const repost of reposts) {
            if (repost.author.id === originalPoster.author.id) {
                selfRepostCount++;
            } else {
                stolenCount++;
            }
        }
        
        return [stolenCount, selfRepostCount];
    }

    formatReportLine(originalPoster, reposts, stolenCount, selfRepostCount) {
        const uploadDate = new Date(originalPoster.timestamp).toISOString().split('T')[0];
        return [
            originalPoster.url,
            originalPoster.author.username,
            originalPoster.location,
            uploadDate,
            reposts.length,
            reposts.map(d => d.author.username).join(';'),
            reposts.map(d => d.location).join(';'),
            stolenCount,
            selfRepostCount
        ].join(',') + '\n';
    }
}

module.exports = new ReportGenerator();