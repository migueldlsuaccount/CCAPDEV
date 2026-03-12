const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, (req, res) => {
  res.sendFile('main.html', { root: './views' });
});

router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.sendFile('login.html', { root: './views' });
});

router.get('/register', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.sendFile('register.html', { root: './views' });
});

router.get('/profile', requireAuth, (req, res) => {
  res.sendFile('profile.html', { root: './views' });
});

module.exports = router;
