const { Router } = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/newsletterController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = Router();

router.post('/subscribe',
  [body('email').isEmail().normalizeEmail(), body('name').optional().trim()],
  validate,
  ctrl.subscribe
);

router.get('/confirm', ctrl.confirm);

router.post('/unsubscribe',
  [body('email').isEmail().normalizeEmail()],
  validate,
  ctrl.unsubscribe
);

router.get('/stats', authenticate, authorize('ADMIN', 'EDITOR'), ctrl.stats);

module.exports = router;
