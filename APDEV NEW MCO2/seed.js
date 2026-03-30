const mongoose = require('mongoose');
const bcryptSeed = require('bcrypt');
const User = require('./models/User');
const Lab = require('./models/Lab');
const Reservation = require('./models/Reservation');
 
const MONGODB_URI = 'mongodb://localhost:27017/lab_reservation';
 
const seed = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected');
 
  const labCount = await Lab.countDocuments();
  if (labCount === 0) {
    await Lab.insertMany([
      { name: 'Computer Lab A' },
      { name: 'Computer Lab B' },
      { name: 'Computer Lab C' },
      { name: 'Computer Lab D' },
      { name: 'Computer Lab E' }
    ]);
    console.log('Labs seeded');
  } else {
    console.log('Labs already exist, skipping');
  }
 
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    await User.insertMany([
       {
      name: 'Miguel Sybingco',
      email: 'miguel@dlsu.edu.ph',
      password: await bcryptSeed.hash('1234', 10),
      role: 'student',
      picture: 'https://via.placeholder.com/150',
      description: 'Computer Science student'
    },
    {
      name: 'Ian Jamero',
      email: 'ian@dlsu.edu.ph',
      password: await bcryptSeed.hash('1234', 10),
      role: 'student'
    },
    {
      name: 'John Christian Llamas',
      email: 'john@dlsu.edu.ph',
      password: await bcryptSeed.hash('1234', 10),
      role: 'student'
    },
    {
      name: 'Ethan Sia',
      email: 'ethan@dlsu.edu.ph',
      password: await bcryptSeed.hash('1234', 10),
      role: 'student'
    },
    {
      name: 'Lab Tech Ramon',
      email: 'tech@dlsu.edu.ph',
      password: await bcryptSeed.hash('admin', 10),
      role: 'technician'
    },
    {
      name: 'Lab Tech Joe',
      email: 'tech2@dlsu.edu.ph',
      password: await bcryptSeed.hash('admin', 10),
      role: 'technician'
    }
    ]);
    console.log('Users seeded');
  } else {
    console.log('Users already exist, skipping');
  }
 
  const reservationCount = await Reservation.countDocuments();
  if (reservationCount === 0) {
    const miguel = await User.findOne({ email: 'miguel@dlsu.edu.ph' });
    const ian    = await User.findOne({ email: 'ian@dlsu.edu.ph' });
    const john   = await User.findOne({ email: 'john@dlsu.edu.ph' });
    const ethan  = await User.findOne({ email: 'ethan@dlsu.edu.ph' });
    const ramon  = await User.findOne({ email: 'tech@dlsu.edu.ph' });
 
    const labA = await Lab.findOne({ name: 'Computer Lab A' });
    const labB = await Lab.findOne({ name: 'Computer Lab B' });
    const labC = await Lab.findOne({ name: 'Computer Lab C' });

    const today = new Date();
    const d = (daysAhead) => {
      const date = new Date(today);
      date.setDate(today.getDate() + daysAhead);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    };
 
    await Reservation.insertMany([
      {
        lab: labA._id,
        user: miguel._id,
        seat: 1,
        date: d(1),
        slots: ['08:00', '08:30'],
        anonymous: false,
        requestTime: new Date()
      },
      {
        lab: labA._id,
        user: ian._id,
        seat: 2,
        date: d(1),
        slots: ['09:00', '09:30'],
        anonymous: false,
        requestTime: new Date()
      },
      {
        lab: labB._id,
        user: john._id,
        seat: 3,
        date: d(2),
        slots: ['10:00', '10:30', '11:00'],
        anonymous: false,
        requestTime: new Date()
      },
      {
        lab: labC._id,
        user: ethan._id,
        seat: 5,
        date: d(3),
        slots: ['13:00', '13:30'],
        anonymous: true,
        requestTime: new Date()
      },
      {
        lab: labB._id,
        user: ramon._id,
        seat: 7,
        date: d(4),
        slots: ['14:00', '14:30'],
        walkInName: 'Maria Santos',
        createdBy: ramon._id,
        requestTime: new Date()
      }
    ]);
    console.log('Reservations seeded');
  } else {
    console.log('Reservations already exist, skipping');
  }
 
  await mongoose.disconnect();
  console.log('Seed complete');
};
 
seed().catch(err => {
  console.error(err);
  process.exit(1);
});