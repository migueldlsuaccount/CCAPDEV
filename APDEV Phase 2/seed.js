const mongoose = require('mongoose');
const User = require('./models/User');
const Lab = require('./models/Lab');

const MONGODB_URI = 'mongodb://localhost:27017/lab_reservation';

const seed = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected');

  // Seed Labs
  const labCount = await Lab.countDocuments();
  if (labCount === 0) {
    await Lab.insertMany([
      {
        name: 'Computer Lab A',
        availableSeats: ['Seat 1','Seat 2','Seat 3','Seat 4','Seat 5','Seat 6','Seat 7','Seat 8','Seat 9','Seat 10']
      },
      {
        name: 'Computer Lab B',
        availableSeats: ['Seat 1','Seat 2','Seat 3','Seat 4','Seat 5','Seat 6','Seat 7','Seat 8','Seat 9','Seat 10']
      },
      {
        name: 'Computer Lab C',
        availableSeats: ['Seat 1','Seat 2','Seat 3','Seat 4','Seat 5','Seat 6','Seat 7','Seat 8','Seat 9','Seat 10']
      }
    ]);
    console.log('Labs seeded');
  } else {
    console.log('Labs already exist, skipping');
  }

  // Ensure every lab has a seat capacity defined (used for per-slot availability)
  await Lab.updateMany(
    { availableSeats: { $exists: false } },
    { $set: { availableSeats: ['Seat 1','Seat 2','Seat 3','Seat 4','Seat 5','Seat 6','Seat 7','Seat 8','Seat 9','Seat 10'] } }
  );

  // Seed Users
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    await User.insertMany([
      {
        name: 'Miguel Sybingco',
        email: 'miguel@dlsu.edu.ph',
        password: '1234',
        role: 'student',
        picture: 'https://via.placeholder.com/150',
        description: 'Computer Science student'
      },
      {
        name: 'Ian Jamero',
        email: 'ian@dlsu.edu.ph',
        password: '1234',
        role: 'student',
        picture: 'https://via.placeholder.com/150',
        description: 'Computer Science student'
      },
      {
        name: 'John Christian Llamas',
        email: 'john@dlsu.edu.ph',
        password: '1234',
        role: 'student',
        picture: 'https://via.placeholder.com/150',
        description: 'Computer Science student'
      },
      {
        name: 'Ethan Sia',
        email: 'ethan@dlsu.edu.ph',
        password: '1234',
        role: 'student',
        picture: 'https://via.placeholder.com/150',
        description: 'Computer Science student'
      },
      {
        name: 'Lab Tech Ramon',
        email: 'tech@dlsu.edu.ph',
        password: 'admin',
        role: 'technician',
        picture: 'https://via.placeholder.com/150',
        description: 'Lab Technician'
      },
      {
        name: 'Lab Tech Joe',
        email: 'tech2@dlsu.edu.ph',
        password: 'admin',
        role: 'technician',
        picture: 'https://via.placeholder.com/150',
        description: 'Lab Technician'
      }
    ]);
    console.log('Users seeded');
  } else {
    console.log('Users already exist, skipping');
  }

  await mongoose.disconnect();
  console.log('Seed complete');
};

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
