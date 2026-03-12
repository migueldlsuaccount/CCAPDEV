const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  lab: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String,
    required: true
  },
  slots: {
    type: [String],
    required: true,
    validate: {
      validator: v => v.length > 0,
      message: 'At least one slot is required'
    }
  },
  anonymous: {
    type: Boolean,
    default: false
  },
  // Walk-in: technician booked on behalf of a student by name
  walkInName: {
    type: String,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  requestTime: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

reservationSchema.index({ lab: 1, date: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
