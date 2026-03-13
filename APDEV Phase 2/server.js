const express = require('express');
const session = require('express-session');
const connectDB = require('./config/db');

const app = express();
const PORT = 3000;

// Connect to MongoDB
connectDB();

// Parse incoming requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup (stored in memory for now)
app.use(session({
  secret: 'lab_reservation_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Serve static files (CSS, client-side JS)
app.use('/public', express.static('public'));

// Routes
app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));
app.use('/labs', require('./routes/labs'));
app.use('/reservations', require('./routes/reservations'));
app.use('/users', require('./routes/users'));

app.listen(PORT, () => {
  console.log('Server running at http://localhost:' + PORT);
});
