const { Router } = require('express');
const ctrl = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

router.get('/dashboard', authenticate, authorize('ADMIN', 'EDITOR'), ctrl.dashboard);
router.post('/pageview', ctrl.trackPageView);

module.exports = router;
