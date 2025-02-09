const { IMAGE } = require('../../config/constants');
const logger = require('../utils/logger');

/**
 * Validates if an attachment is a supported image file
 * @param {Discord.MessageAttachment} attachment - The Discord attachment to validate
 * @returns {boolean} True if the attachment is a supported image, false otherwise
 */
function isSupportedImage(attachment) {
    try {
        // Check if attachment exists
        if (!attachment) {
            return false;
        }

        // Check file size
        if (attachment.size > IMAGE.MAX_FILE_SIZE) {
            logger.logMessage('VALIDATION_ERROR', {
                error: 'File size exceeds limit',
                size: attachment.size,
                maxSize: IMAGE.MAX_FILE_SIZE,
                url: attachment.url
            });
            return false;
        }

        // Get the file extension and content type
        const contentType = attachment.contentType;
        const fileName = attachment.name?.toLowerCase() || '';
        const fileExtension = fileName.split('.').pop();

        // List of supported extensions
        const supportedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'bmp'];

        // Check if the content type is supported
        const isContentTypeSupported = IMAGE.SUPPORTED_TYPES.includes(contentType);

        // Check if the file extension is supported
        const isExtensionSupported = supportedExtensions.includes(fileExtension);

        // Check if the content type is not explicitly excluded
        const isNotExcluded = !IMAGE.EXCLUDED_TYPES.includes(contentType);

        // Log validation result
        if (!isContentTypeSupported || !isExtensionSupported || !isNotExcluded) {
            logger.logMessage('VALIDATION_ERROR', {
                error: 'Unsupported image type',
                contentType,
                extension: fileExtension,
                url: attachment.url
            });
        }

        // Return true only if all checks pass
        return isContentTypeSupported && isExtensionSupported && isNotExcluded;

    } catch (error) {
        logger.logMessage('VALIDATION_ERROR', {
            error: error.message,
            stack: error.stack,
            attachmentUrl: attachment?.url
        });
        return false;
    }
}

/**
 * Validates image dimensions
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {boolean} True if dimensions are valid
 */
function isValidDimensions(width, height) {
    // Minimum dimensions (to avoid processing tiny images)
    const MIN_DIMENSION = 32;
    // Maximum dimensions (to avoid processing huge images)
    const MAX_DIMENSION = 4096;

    return width >= MIN_DIMENSION && 
           height >= MIN_DIMENSION && 
           width <= MAX_DIMENSION && 
           height <= MAX_DIMENSION;
}

module.exports = {
    isSupportedImage,
    isValidDimensions
};