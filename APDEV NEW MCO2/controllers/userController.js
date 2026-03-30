const User = require('../models/User');
const Reservation = require('../models/Reservation');

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
};

exports.getUserByEmail = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email.toLowerCase() }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { picture, description } = req.body;

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

exports.deleteAccount = async (req, res) => {
  try {
    if (req.params.id !== req.session.userId.toString()) {
      return res.status(403).json({ error: 'Not authorized.' });
    }
    
    await Reservation.updateMany(
      { user: req.params.id },
      { $set: { user: null } }
    );

    const today = new Date().toISOString().split('T')[0];

    await Reservation.deleteMany({
      user: req.params.id,
      date: { $gte: today }
    });

    await User.findByIdAndDelete(req.params.id);

    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account.' });
  }
};

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
