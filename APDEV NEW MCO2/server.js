const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connectDB = require('./config/db');

const app = express();
const PORT = 3000;
const MONGODB_URI = 'mongodb://localhost:27017/lab_reservation';

// Connect to MongoDB
connectDB();

// Parse incoming requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup 
app.use(session({
  secret: 'lab_reservation_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 1 day default
  }
}));

// Extend remember me cookie on each visit
app.use((req, res, next) => {
  if (req.session && req.session.userId && req.session.cookie && req.session.cookie.originalMaxAge > 0) {
    req.session.cookie.maxAge = 21 * 24 * 60 * 60 * 1000; 
  }
  next();
});

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