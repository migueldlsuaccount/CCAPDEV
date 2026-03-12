require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Lab = require('./models/Lab');

const seed = async () => {
  await connectDB();

  // Seed Labs
  const labCount = await Lab.countDocuments();
  if (labCount === 0) {
    await Lab.insertMany([
      { name: 'Computer Lab A' },
      { name: 'Computer Lab B' },
      { name: 'Computer Lab C' }
    ]);
    console.log('✅ Labs seeded');
  } else {
    console.log('ℹ️  Labs already exist, skipping');
  }

  // Seed Users (plain-text passwords, no hashing for this phase)
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
    console.log('✅ Users seeded');
  } else {
    console.log('ℹ️  Users already exist, skipping');
  }

  await mongoose.disconnect();
  console.log('✅ Seed complete');
};

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
