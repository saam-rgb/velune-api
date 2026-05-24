const { Router } = require('express');
const { upload } = require('../services/cloudinary');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const ApiError = require('../utils/ApiError');

const router = Router();

router.post('/image',
  authenticate,
  authorize('ADMIN', 'EDITOR', 'AUTHOR'),
  uploadLimiter,
  (req, res, next) => {
    upload.single('image')(req, res, err => {
      if (err) return next(ApiError.badRequest(err.message));
      next();
    });
  },
  (req, res) => {
    if (!req.file) throw ApiError.badRequest('No file uploaded');
    res.json({
      url: req.file.path,
      publicId: req.file.filename,
    });
  }
);

module.exports = router;
