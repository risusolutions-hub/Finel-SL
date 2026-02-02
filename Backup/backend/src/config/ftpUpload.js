// FTP functionality permanently removed. Keep a minimal stub to avoid runtime require errors.
module.exports = {
  uploadToFTP: async () => { throw new Error('FTP support removed'); },
  uploadMultipleToFTP: async () => { throw new Error('FTP support removed'); },
  downloadFromFTP: async () => { throw new Error('FTP support removed'); },
  deleteFromFTP: async () => { throw new Error('FTP support removed'); },
  checkFTPConnection: async () => ({ connected: false }),
  hybridUpload: async () => { throw new Error('FTP support removed'); },
  ftpConfig: null
};
