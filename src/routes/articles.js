const { Router } = require('express');
const { body, param, query } = require('express-validator');
const ctrl = require('../controllers/articlesController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = Router();

const articleBody = [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('excerpt').optional().trim(),
  // body can be an HTML string (Tiptap) or a non-empty array (legacy/seed)
  body('body')
    .custom(val => {
      if (typeof val === 'string' && val.trim().length > 0) return true;
      if (Array.isArray(val) && val.length > 0) return true;
      throw new Error('Body is required');
    }),
  body('category').isIn(['Tech', 'Fashion', 'Health', 'Lifestyle', 'Grooming']),
];

// Public
router.get('/', ctrl.list);
router.get('/:slug', ctrl.getBySlug);
router.get('/:slug/related', ctrl.related);

// Protected
router.post('/', authenticate, authorize('ADMIN', 'EDITOR', 'AUTHOR'), articleBody, validate, ctrl.create);
router.patch('/:id', authenticate, ctrl.update);
router.delete('/:id', authenticate, ctrl.remove);

module.exports = router;
