const express = require("express");
const cloudinary = require("cloudinary").v2;

const router = express.Router();
router.post('/generate-signed-url', (req, res) => {
  const { filePath } = req.body;

  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }

  try {
    // Generate a signed URL
    const signedUrl = cloudinary.utils.private_download_url(filePath, 'pdf', {
      resource_type: 'raw', // Match the uploaded resource type
    });

    res.json({ url: signedUrl });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
});


module.exports = router;
