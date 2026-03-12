# Lab Reservation System

A Node.js + Express + MongoDB application following the **MVC** (Model-View-Controller) pattern.

---

## Project Structure

```
lab-reservation/
│
├── config/
│   └── db.js                  # MongoDB connection
│
├── controllers/               # logic (C in MVC)
│   ├── authController.js
│   ├── labController.js
│   └── reservationController.js
│
├── middleware/
│   └── auth.js                # Session auth guards
│
├── models/                    # Mongoose schemas (M in MVC)
│   ├── User.js
│   ├── Lab.js
│   └── Reservation.js
│
├── routes/                    # URL routing
│   ├── auth.js
│   ├── labs.js
│   ├── reservations.js
│   └── pages.js
│
├── views/                     # HTML pages (V in MVC)
│   ├── login.html
│   ├── register.html
│   └── main.html
│
├── public/                    # Static assets (CSS, client JS)
│   ├── main.css
│   ├── auth.css
│   └── main.js
│
├── seed.js                    # Seeds default labs and users
├── server.js                  # Entry point
├── .env
└── package.json
```

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Seed the database
```bash
node seed.js
```
This creates the 3 labs and 6 default users.

### 3. Start the server
```bash
# Production
npm start

### 4. Open in browser
```
http://localhost:3000
```

---

