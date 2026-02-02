const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Detect if running on Vercel or read-only filesystem
const IS_VERCEL = !!process.env.VERCEL;
const IS_READ_ONLY = process.env.NODE_ENV === 'production' && process.env.UPLOAD_STORAGE !== 'disk';

// Use memory storage for Vercel/serverless (or cloud storage)
if (IS_VERCEL || IS_READ_ONLY) {
  console.log('📦 Using memory storage for uploads (Vercel/Serverless detected)');
  module.exports = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600') // 100MB default
    }
  });
} else {
  // Use disk storage for local development
  const uploadDir = path.join(__dirname, '../../uploads');
  const ticketUploadsDir = path.join(uploadDir, 'tickets');

  // Create directories safely
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    if (!fs.existsSync(ticketUploadsDir)) {
      fs.mkdirSync(ticketUploadsDir, { recursive: true });
    }
  } catch (err) {
    console.warn('⚠️  Could not create upload directories:', err.message);
    // Fall back to memory storage
    module.exports = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600')
      }
    });
    module.exports.exports = true;
  }

  // Configure disk storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Create folder structure: uploads/tickets/YYYY-MM/
      const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const destPath = path.join(ticketUploadsDir, yearMonth);
    
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    
    cb(null, destPath);
  },
    filename: (req, file, cb) => {
      // Generate unique filename: timestamp-random-originalname
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
      cb(null, `${uniqueSuffix}-${baseName}${ext}`);
    }
  });

// File filter - allow images, videos, PDFs, documents
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    // Videos
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed. Allowed: images, videos, PDF, documents`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max per file
    files: 10 // Max 10 files per upload
  }
});

module.exports = { upload, uploadDir, ticketUploadsDir };
