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

// Generate the same 30-minute slot times used by the UI
function generateTimeSlots() {
  const slots = [];
  let hour = 8, minute = 0;
  while (hour < 18) {
    slots.push(String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0'));
    minute += 30;
    if (minute === 60) { minute = 0; hour++; }
  }
  return slots;
}

function computeTakenCounts(reservations) {
  const counts = {};
  reservations.forEach(r => {
    r.slots.forEach(slot => {
      counts[slot] = (counts[slot] || 0) + 1;
    });
  });
  return counts;
}

// GET /reservations/slots?labId=&date=
exports.getTakenSlots = async (req, res) => {
  try {
    const { labId, date } = req.query;
    if (!labId || !date) return res.status(400).json({ error: 'labId and date required.' });

    const lab = await Lab.findById(labId);
    if (!lab) return res.status(404).json({ error: 'Lab not found.' });

    const reservations = await Reservation.find({ lab: labId, date });
    const takenSlots = reservations.flatMap(r => r.slots);
    const takenCounts = computeTakenCounts(reservations);

    const slotCapacity = (lab.availableSeats && lab.availableSeats.length > 0)
      ? lab.availableSeats.length
      : generateTimeSlots().length;

    res.json({ takenSlots, takenCounts, slotCapacity });
  } catch (err) {
    console.error(err);
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

    const lab = await Lab.findById(labId);
    if (!lab) return res.status(404).json({ error: 'Lab not found.' });

    // Check if user already has a reservation at any of these slots
    const userReservations = await Reservation.find({ user: req.session.userId, lab: labId, date });
    const userTakenSlots = userReservations.flatMap(r => r.slots);
    const userConflict = slots.some(s => userTakenSlots.includes(s));
    if (userConflict) {
      return res.status(409).json({ error: 'You already have a reservation at one or more of these time slots.' });
    }

    const existing = await Reservation.find({ lab: labId, date });
    const takenCounts = computeTakenCounts(existing);
    const slotCapacity = (lab.availableSeats && lab.availableSeats.length > 0)
      ? lab.availableSeats.length
      : generateTimeSlots().length;

    const conflict = slots.some(s => (takenCounts[s] || 0) >= slotCapacity);
    if (conflict) {
      return res.status(409).json({ error: 'One or more selected slots are already fully booked.' });
    }

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

    const lab = await Lab.findById(labId);
    if (!lab) return res.status(404).json({ error: 'Lab not found.' });

    // Check if user already has a reservation at any of these slots
    const userReservations = await Reservation.find({ user: req.session.userId, lab: labId, date });
    const userTakenSlots = userReservations.flatMap(r => r.slots);
    const userConflict = slots.some(s => userTakenSlots.includes(s));
    if (userConflict) {
      return res.status(409).json({ error: 'You already have a reservation at one or more of these time slots.' });
    }

    const existing = await Reservation.find({ lab: labId, date });
    const takenCounts = computeTakenCounts(existing);
    const slotCapacity = (lab.availableSeats && lab.availableSeats.length > 0)
      ? lab.availableSeats.length
      : generateTimeSlots().length;

    const conflict = slots.some(s => (takenCounts[s] || 0) >= slotCapacity);
    if (conflict) {
      return res.status(409).json({ error: 'One or more selected slots are already fully booked.' });
    }

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

// PATCH /reservations/:id - owner or technician can edit date
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

    const lab = await Lab.findById(reservation.lab);
    const slotCapacity = (lab && lab.availableSeats && lab.availableSeats.length > 0)
      ? lab.availableSeats.length
      : generateTimeSlots().length;

    const existing = await Reservation.find({
      lab: reservation.lab,
      date,
      _id: { $ne: reservation._id }
    });
    const takenCounts = computeTakenCounts(existing);
    const conflict = reservation.slots.some(s => (takenCounts[s] || 0) >= slotCapacity);

    if (conflict) {
      return res.status(409).json({ error: 'One or more slots are already full on that date.' });
    }

    reservation.date = date;
    await reservation.save();

    res.json({ success: true, reservation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update reservation.' });
  }
};

// DELETE /reservations/:id - technician only, remove after 10 min grace period.
exports.deleteReservation = async (req, res) => {
  try {
    if (req.session.userRole !== 'technician') {
      return res.status(403).json({ error: 'Only technicians can remove reservations.' });
    }

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found.' });

    const now = new Date();
    const slotStart = new Date(`${reservation.date}T${reservation.slots[0]}:00`);
    const minutesSinceStart = (now - slotStart) / 60000;

    // Student hasnt shown up in the 10 minute grace period
    if (minutesSinceStart < 10) {
      return res.status(400).json({ error: 'Cannot remove yet. The 10 minute grace period has not ended.' });
    }


    await reservation.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete reservation.' });
  }
};

// DELETE /reservations/:id - cancel reservation
exports.cancelReservation = async (req, res) => {
  const { id } = req.params;
  const reservation = await Reservation.findById(id);
  if (!reservation) return res.status(404).send('Reservation not found');
  const lab = await Lab.findById(reservation.labId);
  // Restore seat
  lab.availableSeats.push(reservation.seat);
  await lab.save();
  await Reservation.findByIdAndDelete(id);
  res.send(`Reservation exited at ${new Date().toISOString()}, seat ${reservation.seat} released`);
};


