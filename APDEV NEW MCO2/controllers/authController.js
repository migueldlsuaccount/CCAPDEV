const User = require('../models/User');

// POST /auth/login
exports.login = async (req, res) => {
  try {
    const { email, password, remember } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase(), password });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    req.session.userId = user._id;
    req.session.userRole = user.role;
    req.session.userName = user.name;

    if (remember === true || remember === 'true') {
      req.session.cookie.maxAge = 21 * 24 * 60 * 60 * 1000; // 3 weeks
    }

    return res.json({ success: true, user });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
};

// POST /auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      picture: 'https://via.placeholder.com/150',
      description: 'No description yet'
    });

    return res.status(201).json({ success: true, user });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(' ') });
    }
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Server error during registration.' });
  }
};

// POST /auth/logout
exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Logout failed.' });
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
};

// GET /auth/me
exports.getMe = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};