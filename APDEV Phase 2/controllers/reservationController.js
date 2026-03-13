const Reservation = require('../models/Reservation');
const Lab = require('../models/Lab');

// GET /reservations — 
exports.getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({})
      .populate('lab', 'name')
      .populate('user', 'name email')
      .populate('createdBy', 'name')
      .sort({ date: 1 });

    const shaped = reservations.map(r => {
      const isOwner = r.user._id.toString() === req.session.userId.toString();
      const isTech  = req.session.userRole === 'technician';

      return {
        _id: r._id,
        lab: r.lab,
        displayName: r.walkInName
          ? `${r.walkInName} (Walk-in)`
          : (r.anonymous && !isOwner && !isTech)
            ? 'Anonymous'
            : r.user.name,
        ownerEmail: r.walkInName ? null : r.user.email,
        owner: r.user._id,
        isOwner,
        date: r.date,
        slots: r.slots,
        anonymous: r.anonymous,
        walkInName: r.walkInName,
        createdBy: r.createdBy ? r.createdBy.name : null,
        requestTime: r.requestTime
      };
    });

    res.json({ reservations: shaped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reservations.' });
  }
};

// GET /reservations/slots?labId=&date=
exports.getTakenSlots = async (req, res) => {
  try {
    const { labId, date } = req.query;
    if (!labId || !date) return res.status(400).json({ error: 'labId and date required.' });

    const reservations = await Reservation.find({ lab: labId, date });
    const takenSlots = reservations.flatMap(r => r.slots);

    res.json({ takenSlots });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch taken slots.' });
  }
};

// POST /reservations — create a reservation (student)
exports.createReservation = async (req, res) => {
  try {
    const { labId, date, slots, anonymous } = req.body;

    if (!labId || !date || !slots || slots.length === 0) {
      return res.status(400).json({ error: 'labId, date, and slots are required.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 7);
    const selected = new Date(date + 'T00:00:00');

    if (selected < today || selected > maxDate) {
      return res.status(400).json({ error: 'Date must be within the next 7 days.' });
    }

    const existing = await Reservation.find({ lab: labId, date });
    const takenSlots = existing.flatMap(r => r.slots);
    const conflict = slots.some(s => takenSlots.includes(s));

    if (conflict) {
      return res.status(409).json({ error: 'One or more selected slots are already reserved.' });
    }

    const lab = await Lab.findById(labId);
    if (!lab) return res.status(404).json({ error: 'Lab not found.' });

    const reservation = await Reservation.create({
      lab: labId,
      user: req.session.userId,
      date,
      slots,
      anonymous: anonymous || false
    });

    const populated = await reservation.populate([
      { path: 'lab', select: 'name' },
      { path: 'user', select: 'name email' }
    ]);

    res.status(201).json({ success: true, reservation: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create reservation.' });
  }
};

// POST /reservations/walkin — technician creates walk-in reservation
exports.createWalkIn = async (req, res) => {
  try {
    if (req.session.userRole !== 'technician') {
      return res.status(403).json({ error: 'Only technicians can create walk-in reservations.' });
    }

    const { labId, date, slots, walkInName } = req.body;

    if (!labId || !date || !slots || slots.length === 0 || !walkInName) {
      return res.status(400).json({ error: 'labId, date, slots, and walkInName are required.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 7);
    const selected = new Date(date + 'T00:00:00');

    if (selected < today || selected > maxDate) {
      return res.status(400).json({ error: 'Date must be within the next 7 days.' });
    }

    const existing = await Reservation.find({ lab: labId, date });
    const takenSlots = existing.flatMap(r => r.slots);
    const conflict = slots.some(s => takenSlots.includes(s));

    if (conflict) {
      return res.status(409).json({ error: 'One or more selected slots are already reserved.' });
    }

    const lab = await Lab.findById(labId);
    if (!lab) return res.status(404).json({ error: 'Lab not found.' });

    const reservation = await Reservation.create({
      lab: labId,
      user: req.session.userId,
      walkInName,
      createdBy: req.session.userId,
      date,
      slots
    });

    const populated = await reservation.populate([
      { path: 'lab', select: 'name' },
      { path: 'user', select: 'name' },
      { path: 'createdBy', select: 'name' }
    ]);

    res.status(201).json({ success: true, reservation: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create walk-in reservation.' });
  }
};

// PATCH /reservations/:id — owner or technician can edit date
exports.editReservation = async (req, res) => {
  try {
    const { date } = req.body;
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) return res.status(404).json({ error: 'Reservation not found.' });

    const isOwner = reservation.user.toString() === req.session.userId.toString();
    const isTech  = req.session.userRole === 'technician';
    if (!isOwner && !isTech) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    const existing = await Reservation.find({
      lab: reservation.lab,
      date,
      _id: { $ne: reservation._id }
    });
    const takenSlots = existing.flatMap(r => r.slots);
    const conflict = reservation.slots.some(s => takenSlots.includes(s));

    if (conflict) {
      return res.status(409).json({ error: 'One or more slots are already taken on that date.' });
    }

    reservation.date = date;
    await reservation.save();

    res.json({ success: true, reservation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update reservation.' });
  }
};

// DELETE /reservations/:id — technician only, within 10 min of booking
exports.deleteReservation = async (req, res) => {
  try {
    if (req.session.userRole !== 'technician') {
      return res.status(403).json({ error: 'Only technicians can remove reservations.' });
    }

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found.' });

    const now = new Date();
    const bookedAt = new Date(reservation.requestTime);
    const diffMinutes = (now - bookedAt) / 60000;

    if (diffMinutes > 10) {
      return res.status(400).json({ error: 'Cannot remove. The 10-minute window has passed.' });
    }

    await reservation.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete reservation.' });
  }
};

