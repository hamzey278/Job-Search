const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('../config/logger');

// Ensure temp directory exists locally for stage-one file writing
const tempDir = path.join(process.env.UPLOADS_PATH || path.join(__dirname, '../../uploads'), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Storage options
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Generate UUID to prevent filename collisions and directory traversal
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = crypto.randomUUID() + ext;
    cb(null, uniqueName);
  }
});

// Initial validation on extensions and MIME claims
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.docx'];
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(mime)) {
    return cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Cap size at 5MB
  }
});

/**
 * Secondary upload validation. Check magic bytes and run mock anti-virus scan.
 */
const validateUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = req.file.path;
  const mimetype = req.file.mimetype;

  try {
    // Read the first 4 bytes of the uploaded file to verify signature headers
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(4);
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);
    const hex = buffer.toString('hex').toUpperCase();

    let isValid = false;
    if (mimetype === 'application/pdf') {
      // PDF format signature: 25504446 (%PDF)
      isValid = hex === '25504446';
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // DOCX format signature (Standard PK ZIP header): 504B0304 (PK..)
      isValid = hex === '504B0304';
    }

    if (!isValid) {
      // Immediately delete invalid file to mitigate risks
      fs.unlinkSync(filePath);
      
      logger.logSecurity('Malicious File Upload Blocked: Magic Bytes Mismatch', req.user ? req.user.userId : null, req.ip, {
        originalName: req.file.originalname,
        mimetype,
        magicBytes: hex
      });

      return res.status(400).json({ 
        error: 'Security validation failed: File headers do not match extension format.' 
      });
    }

    // 2. Anti-Virus Scan placeholder
    logger.info(`Scanning file ${req.file.filename} for viruses...`);
    const isClean = true; // Simulating ClamAV results

    if (!isClean) {
      fs.unlinkSync(filePath);
      logger.logSecurity('Virus Detected: File Deleted', req.user ? req.user.userId : null, req.ip, {
        filename: req.file.filename
      });
      return res.status(400).json({ error: 'Security validation failed: Virus scanner marked the file as dangerous.' });
    }

    next();
  } catch (err) {
    logger.error('Error in post-upload validation check', err);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkErr) {
        logger.error('Cleanup unlinking failed after error', unlinkErr);
      }
    }
    return res.status(500).json({ error: 'System error validating resume file upload' });
  }
};

module.exports = {
  uploadResume: upload.single('resume'),
  validateUpload
};
