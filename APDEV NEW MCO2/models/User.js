const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  role: {
    type: String,
    enum: ['student', 'technician'],
    default: 'student'
  },
  picture: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  description: {
    type: String,
    default: 'No description yet'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
