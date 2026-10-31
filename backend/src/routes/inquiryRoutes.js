const express = require('express');
const router = express.Router();
const c = require('../controllers/inquiryController');
const { auth } = require('../middleware/authMiddleware');

router.post('/', c.create);
router.get('/dashboard/stats', auth, c.dashboard);
router.get('/dashboard/analytics', auth, c.dashboardAnalytics);
router.get('/:id', auth, c.getOne);
router.patch('/:id/status', auth, c.patchStatus);
router.get('/', auth, c.list);

module.exports = router;
