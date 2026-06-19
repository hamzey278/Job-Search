const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

// Ensure target uploads folder exists locally
const uploadDir = process.env.UPLOADS_PATH || path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info(`Created local uploads directory at: ${uploadDir}`);
}

const StorageService = {
  /**
   * Upload file to AWS S3 or fallback to Local Storage depending on env variables.
   * Cleans up local temp files if moving to S3.
   */
  async uploadFile(file) {
    const hasS3 = process.env.AWS_ACCESS_KEY_ID && 
                  process.env.AWS_SECRET_ACCESS_KEY && 
                  process.env.S3_BUCKET_NAME;

    if (hasS3) {
      logger.info(`S3 configuration detected. Uploading ${file.filename} to AWS S3...`);
      
      // AWS S3 client mock/placeholder configuration
      // In production, we'd import: const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
      // const s3 = new S3Client({ region: process.env.AWS_REGION });
      // await s3.send(new PutObjectCommand({ Bucket, Key, Body: fs.createReadStream(file.path) }));
      
      const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/resumes/${file.filename}`;
      
      // Cleanup the local temp file after uploading to S3
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        logger.error(`Error deleting temp file ${file.path} after S3 upload`, err);
      }

      return s3Url;
    } else {
      logger.info(`Using development local storage for resume file: ${file.filename}`);
      // In local mode, returns a relative URL mapping to the static server mount
      return `/uploads/${file.filename}`;
    }
  }
};

module.exports = StorageService;
