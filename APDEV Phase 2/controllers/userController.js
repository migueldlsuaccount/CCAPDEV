const User = require('../models/User');
const Reservation = require('../models/Reservation');

// GET /users/:id — get any user's public profile
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
};

// GET /users/by-email/:email — look up user by email (for profile links)
exports.getUserByEmail = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email.toLowerCase() }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
};

// PATCH /users/:id — edit own profile (picture and description only)
exports.updateProfile = async (req, res) => {
  try {
    const { picture, description } = req.body;

    // Only allow editing own profile
    if (req.params.id !== req.session.userId.toString()) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { picture, description },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

// DELETE /users/:id — delete own account and all reservations
exports.deleteAccount = async (req, res) => {
  try {
    if (req.params.id !== req.session.userId.toString()) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    await Reservation.deleteMany({ user: req.params.id });
    await User.findByIdAndDelete(req.params.id);

    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account.' });
  }
};

// GET /users/:id/reservations — get a user's reservations (own or technician)
exports.getUserReservations = async (req, res) => {
  try {
    const isSelf = req.params.id === req.session.userId.toString();
    const isTech = req.session.userRole === 'technician';

    if (!isSelf && !isTech) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    const reservations = await Reservation.find({ user: req.params.id })
      .populate('lab', 'name')
      .sort({ date: 1 });

    res.json({ reservations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reservations.' });
  }
};
