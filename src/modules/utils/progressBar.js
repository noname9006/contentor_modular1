class ProgressBar {
    createProgressBar(progress) {
        const barLength = 20;
        const filledLength = Math.round(progress * barLength);
        const emptyLength = barLength - filledLength;
        return '█'.repeat(filledLength) + '░'.repeat(emptyLength);
    }

    createProgressUpdate({ current, total, processedImages, duplicatesFound, elapsedTime, currentItem = '' }) {
        const progress = ((current / total) * 100).toFixed(2);
        const progressBar = this.createProgressBar(current / total);
        
        return (
            `Processing...\n` +
            `${progressBar}\n` +
            `Progress: ${progress}% (${current.toLocaleString()}/${total.toLocaleString()})\n` +
            `Images processed: ${processedImages.toLocaleString()}\n` +
            `Duplicates found: ${duplicatesFound.toLocaleString()}\n` +
            `Time elapsed: ${elapsedTime}` +
            (currentItem ? `\nCurrently processing: ${currentItem}` : '')
        );
    }
}

module.exports = new ProgressBar();