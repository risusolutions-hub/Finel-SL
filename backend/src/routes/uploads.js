const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { upload, ticketUploadsDir } = require('../config/upload');
const { requireLogin, loadCurrentUser } = require('../middleware/auth');

router.use(loadCurrentUser);

// Upload files for ticket attachments (supports FTP and local)
router.post('/ticket-attachments', requireLogin, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const complaintId = req.body.complaintId || 'general';
    const attachments = [];
    for (const file of req.files) {
      try {
        // Determine yearMonth folder and filename from file path
        const yearMonth = path.basename(path.dirname(file.path));
        const filename = path.basename(file.path);
        const url = `/api/uploads/files/${yearMonth}/${filename}`;

        attachments.push({
          success: true,
          storageType: 'local',
          yearMonth,
          filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url,
          uploadedBy: req.currentUser?.id
        });
      } catch (uploadError) {
        console.error('File processing error:', uploadError);
        attachments.push({
          success: false,
          originalName: file.originalname,
          error: uploadError.message
        });
      }
    }

    const successful = attachments.filter(a => a.success !== false);
    const failed = attachments.filter(a => a.success === false);

    res.json({ 
      success: true, 
      attachments: successful,
      failed,
      message: `${successful.length} file(s) uploaded successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

// Delete a single attachment
// Delete a single attachment (local storage only)
router.delete('/ticket-attachments/:filename', requireLogin, async (req, res) => {
  try {
    const { filename } = req.params;
    const { yearMonth } = req.query;

    if (!yearMonth) {
      return res.status(400).json({ error: 'yearMonth query parameter required' });
    }

    const filePath = path.join(__dirname, '../../uploads/tickets', yearMonth, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'File deleted' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Serve uploaded files (with authentication) - local files
router.get('/files/:yearMonth/:filename', requireLogin, (req, res) => {
  const { yearMonth, filename } = req.params;
  const filePath = path.join(__dirname, '../../uploads/tickets', yearMonth, filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Note: FTP download endpoint removed — files are served via /files/:yearMonth/:filename

module.exports = router;
