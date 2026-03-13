const Reservation = require('../models/Reservation');
const Lab = require('../models/Lab');

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
        seat: r.seat,
        displayName: r.walkInName
          ? `${r.walkInName} (Walk-in)`
          : (r.anonymous && !isOwner && !isTech)
            ? 'Anonymous'
            : r.user.name,
        ownerEmail: r.walkInName || r.anonymous ? null : r.user.email,
        owner: r.user._id,
        isOwner,
        date: r.date,
        slots: r.slots,
        anonymous: r.anonymous,
        walkInName: r.walkInName,
        createdBy: r.createdBy ? r.createdBy.name : null,
        requestTime: r.requestTime,
        isBlocked: r.isBlocked || false
      };
    });

    res.json({ reservations: shaped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reservations.' });
  }
};

exports.getTakenSlots = async (req, res) => {
  try {
    const { labId, date } = req.query;
    if (!labId || !date) return res.status(400).json({ error: 'labId and date required.' });

    const lab = await Lab.findById(labId);
    if (!lab) return res.status(404).json({ error: 'Lab not found.' });

    const reservations = await Reservation.find({ lab: labId, date })
      .populate('user', 'name email');

    const seatMap = {};
    for (let i = 1; i <= 10; i++) {
      seatMap[i] = { taken: [], reservedBy: [] };
    }

    reservations.forEach(r => {
      if (seatMap[r.seat]) {
        seatMap[r.seat].taken.push(...r.slots);
        r.slots.forEach(slot => {
          let reservedBy = 'Unknown';
          if (r.walkInName) {
            reservedBy = r.walkInName + ' (Walk-in)';
          } else if (r.isBlocked) {
            reservedBy = 'BLOCKED';
          } else if (!r.anonymous) {
            reservedBy = r.user.name;
          } else {
            reservedBy = 'Anonymous';
          }
          seatMap[r.seat].reservedBy.push({ slot, reservedBy, userId: r.user._id });
        });
      }
    });

    const seats = Object.keys(seatMap).map(num => ({
      num: parseInt(num),
      taken: seatMap[num].taken,
      reservedBy: seatMap[num].reservedBy
    }));

    res.json({ seats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch taken slots.' });
  }
};

exports.createReservation = async (req, res) => {
  try {
    const { labId, seat, date, slots, anonymous } = req.body;

    if (!labId || !seat || !date || !slots || slots.length === 0) {
      return res.status(400).json({ error: 'labId, seat, date, and slots are required.' });
    }

    if (seat < 1 || seat > 10) {
      return res.status(400).json({ error: 'Seat must be between 1 and 10.' });
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

    const existing = await Reservation.find({ 
      lab: labId, 
      date, 
      seat 
    });
    
    const takenSlots = existing.flatMap(r => r.slots);
    const conflict = slots.some(s => takenSlots.includes(s));

    if (conflict) {
      return res.status(409).json({ error: 'One or more selected slots are already reserved for this seat.' });
    }

    const reservation = await Reservation.create({
      lab: labId,
      user: req.session.userId,
      seat,
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

exports.createWalkIn = async (req, res) => {
  try {
    if (req.session.userRole !== 'technician') {
      return res.status(403).json({ error: 'Only technicians can create walk-in reservations.' });
    }

    const { labId, seat, date, slots, walkInName } = req.body;

    if (!labId || !seat || !date || !slots || slots.length === 0 || !walkInName) {
      return res.status(400).json({ error: 'labId, seat, date, slots, and walkInName are required.' });
    }

    if (seat < 1 || seat > 10) {
      return res.status(400).json({ error: 'Seat must be between 1 and 10.' });
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

    const existing = await Reservation.find({ lab: labId, date, seat });
    const takenSlots = existing.flatMap(r => r.slots);
    const conflict = slots.some(s => takenSlots.includes(s));

    if (conflict) {
      return res.status(409).json({ error: 'One or more selected slots are already reserved for this seat.' });
    }

    const reservation = await Reservation.create({
      lab: labId,
      user: req.session.userId,
      seat,
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

// POST /reservations/block - Technician blocks slots for walk-ins
exports.blockSlots = async (req, res) => {
  try {
    if (req.session.userRole !== 'technician') {
      return res.status(403).json({ error: 'Only technicians can block slots.' });
    }

    const { labId, seat, date, slots } = req.body;

    if (!labId || !seat || !date || !slots || slots.length === 0) {
      return res.status(400).json({ error: 'labId, seat, date, and slots are required.' });
    }

    if (seat < 1 || seat > 10) {
      return res.status(400).json({ error: 'Seat must be between 1 and 10.' });
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

    const existing = await Reservation.find({ lab: labId, date, seat });
    const takenSlots = existing.flatMap(r => r.slots);
    const conflict = slots.some(s => takenSlots.includes(s));

    if (conflict) {
      return res.status(409).json({ error: 'One or more selected slots are already reserved.' });
    }

    // Create a blocked reservation
    const reservation = await Reservation.create({
      lab: labId,
      user: req.session.userId,
      seat,
      date,
      slots,
      walkInName: 'BLOCKED FOR WALK-INS',
      createdBy: req.session.userId,
      isBlocked: true
    });

    res.status(201).json({ success: true, message: 'Slots blocked successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to block slots.' });
  }
};

exports.editReservation = async (req, res) => {
  try {
    const { date, seat, slots } = req.body;
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) return res.status(404).json({ error: 'Reservation not found.' });

    const isOwner = reservation.user.toString() === req.session.userId.toString();
    const isTech  = req.session.userRole === 'technician';
    if (!isOwner && !isTech) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    if (seat && (seat < 1 || seat > 10)) {
      return res.status(400).json({ error: 'Seat must be between 1 and 10.' });
    }

    if (slots && (!Array.isArray(slots) || slots.length === 0)) {
      return res.status(400).json({ error: 'Slots must be a non-empty array.' });
    }

    const checkDate = date || reservation.date;
    const checkSeat = seat || reservation.seat;
    const checkSlots = slots || reservation.slots;

    const existing = await Reservation.find({
      lab: reservation.lab,
      date: checkDate,
      seat: checkSeat,
      _id: { $ne: reservation._id }
    });
    
    const takenSlots = existing.flatMap(r => r.slots);
    const conflict = checkSlots.some(s => takenSlots.includes(s));

    if (conflict) {
      return res.status(409).json({ error: 'One or more slots are already taken on that date/seat.' });
    }

    if (date) reservation.date = date;
    if (seat) reservation.seat = seat;
    if (slots) reservation.slots = slots;
    
    await reservation.save();

    res.json({ success: true, reservation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update reservation.' });
  }
};

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

    if (minutesSinceStart < 10 && !reservation.isBlocked) {
      return res.status(400).json({ error: 'Cannot remove yet. The 10 minute grace period has not ended.' });
    }

    await reservation.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete reservation.' });
  }
};

// GET /reservations/search?date=&time=&labId=
exports.searchSlots = async (req, res) => {
  try {
    const { date, time } = req.query;
    if (!date || !time) {
      return res.status(400).json({ error: 'Date and time are required.' });
    }

    const labs = await Lab.find({ isActive: true });
    const results = [];

    for (const lab of labs) {
      const reservations = await Reservation.find({ 
        lab: lab._id, 
        date 
      });

      const availableSeats = [];
      for (let seat = 1; seat <= 10; seat++) {
        const seatReservations = reservations.filter(r => r.seat === seat);
        const takenSlots = seatReservations.flatMap(r => r.slots);
        if (!takenSlots.includes(time)) {
          availableSeats.push(seat);
        }
      }

      results.push({
        labId: lab._id,
        labName: lab.name,
        availableSeats: availableSeats.length,
        seats: availableSeats
      });
    }

    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to search slots.' });
  }
};