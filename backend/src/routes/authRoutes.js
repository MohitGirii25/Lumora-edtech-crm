const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.get('/me', auth, (req, res) => {
  const { id, name, email } = req.user;
  res.json({ admin: { id, name, email } });
});

module.exports = router;
