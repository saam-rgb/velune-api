const { Router } = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/contactController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const rateLimit = require('express-rate-limit');

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many contact requests. Please wait before trying again.' },
});

const router = Router();

router.post('/',
  contactLimiter,
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
  ],
  validate,
  ctrl.send
);

router.get('/', authenticate, authorize('ADMIN'), ctrl.list);

module.exports = router;
