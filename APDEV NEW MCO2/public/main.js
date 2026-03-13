// state
let currentUser = null;
let allLabs = [];
let selectedSlots = [];
let walkInSlots = [];
let viewingReservations = false;

// bootstrap
(async () => {
  try {
    const res = await fetch('/auth/me');
    if (!res.ok) { window.location.href = '/login'; return; }
    const data = await res.json();
    currentUser = data.user;
    document.getElementById('userInfo').textContent =
      `Logged in as: ${currentUser.name} (${currentUser.role})`;
    await displayLabs();
    showTechSection();
  } catch {
    window.location.href = '/login';
  }
})();

// auth
async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  window.location.href = '/login';
}

function goToProfile() {
  window.location.href = '/profile';
}

// labs
async function displayLabs() {
  const res = await fetch('/labs');
  const { labs } = await res.json();
  allLabs = labs;

  if (currentUser.role === 'student') {
    const container = document.getElementById('labContainer');
    container.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'walkins';
    card.innerHTML = `
      <h4>Reserve a Lab Slot</h4>

      <div class="walkin-field">
        <label for="labSelect">Select Lab:</label>
        <select id="labSelect" onchange="handleLabSelection()">
          <option value="">-- Choose a Lab --</option>
          ${labs.map(l => `<option value="${l._id}">${l.name}</option>`).join('')}
        </select>
      </div>

      <div class="walkin-field">
        <label for="resDate">Select Date:</label>
        <input type="date" id="resDate" onchange="handleLabSelection()">
      </div>

      <div class="walkin-field" id="seatField" style="display:none;">
        <label for="seatSelect">Select Seat (1-10):</label>
        <select id="seatSelect" onchange="loadTimeSlots()">
          <option value="">-- Choose Seat --</option>
          ${Array.from({ length: 10 }, (_, i) => `<option value="${i+1}">Seat ${i+1}</option>`).join('')}
        </select>
      </div>

      <div id="slotButtonsContainer" style="display:none;">
        <label>Select Time Slots:</label>
        <div id="slotButtons" class="walkin-slots"></div>
      </div>

      <div id="anonymousField" style="display:none; margin:10px 0;">
        <label>
          <input type="checkbox" id="anonymousCheck"> Reserve anonymously
        </label>
      </div>

      <div class="walkin-actions" id="reserveBtnField" style="display:none;">
        <button onclick="confirmReservationFromForm()">Confirm Reservation</button>
      </div>
    `;
    container.appendChild(card);

    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 7);
    const dateInput = document.getElementById('resDate');
    dateInput.min = today.toISOString().split('T')[0];
    dateInput.max = maxDate.toISOString().split('T')[0];
  }
}

// time
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

async function handleLabSelection() {
  const labId = document.getElementById('labSelect').value;
  const date = document.getElementById('resDate').value;

  if (!labId || !date) {
    document.getElementById('seatField').style.display = 'none';
    document.getElementById('slotButtonsContainer').style.display = 'none';
    document.getElementById('anonymousField').style.display = 'none';
    document.getElementById('reserveBtnField').style.display = 'none';
    return;
  }

  document.getElementById('seatField').style.display = 'block';
  document.getElementById('slotButtonsContainer').style.display = 'none';
  document.getElementById('anonymousField').style.display = 'none';
  document.getElementById('reserveBtnField').style.display = 'none';
  document.getElementById('seatSelect').value = '';
}

async function loadTimeSlots() {
  const labId = document.getElementById('labSelect').value;
  const date = document.getElementById('resDate').value;
  const seat = document.getElementById('seatSelect').value;

  if (!labId || !date || !seat) {
    document.getElementById('slotButtonsContainer').style.display = 'none';
    document.getElementById('anonymousField').style.display = 'none';
    document.getElementById('reserveBtnField').style.display = 'none';
    return;
  }

  selectedSlots = [];

  const res = await fetch(`/reservations/slots?labId=${labId}&date=${date}`);
  const { seats } = await res.json();

  const seatData = seats.find(s => s.num === parseInt(seat));
  const takenSlots = seatData ? seatData.taken : [];

  const container = document.getElementById('slotButtons');
  container.innerHTML = '';
  document.getElementById('slotButtonsContainer').style.display = 'block';
  document.getElementById('anonymousField').style.display = 'block';
  document.getElementById('reserveBtnField').style.display = 'block';

  generateTimeSlots().forEach(time => {
    const btn = document.createElement('button');
    btn.textContent = time;
    if (takenSlots.includes(time)) {
      btn.disabled = true;
      btn.style.backgroundColor = '#ccc';
      btn.style.color = '#666';
    } else {
      btn.style.backgroundColor = '#90EE90';
      btn.onclick = () => {
        if (selectedSlots.includes(time)) {
          selectedSlots = selectedSlots.filter(t => t !== time);
          btn.classList.remove('selected');
          btn.style.backgroundColor = '#90EE90';
        } else {
          selectedSlots.push(time);
          btn.classList.add('selected');
          btn.style.backgroundColor = 'lightgreen';
        }
      };
    }
    container.appendChild(btn);
  });
}

async function confirmReservationFromForm() {
  const labId = document.getElementById('labSelect')?.value;
  const date = document.getElementById('resDate')?.value;
  const seat = document.getElementById('seatSelect')?.value;
  const anonymous = document.getElementById('anonymousCheck')?.checked || false;

  if (!labId) { alert('Please select a lab.'); return; }
  if (!date) { alert('Please select a date.'); return; }
  if (!seat) { alert('Please select a seat.'); return; }
  if (selectedSlots.length === 0) { alert('Please select at least one time slot.'); return; }

  try {
    const res = await fetch('/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        labId, 
        date, 
        seat: parseInt(seat),
        slots: selectedSlots,
        anonymous 
      })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Reservation failed.'); return; }

    alert('Reservation Successful!');
    selectedSlots = [];
    document.getElementById('seatSelect').value = '';
    document.getElementById('anonymousCheck').checked = false;
    document.getElementById('slotButtonsContainer').style.display = 'none';
    document.getElementById('anonymousField').style.display = 'none';
    document.getElementById('reserveBtnField').style.display = 'none';
    if (viewingReservations) {
      viewingReservations = false;
      await showMyReservations();
    }
  } catch {
    alert('Network error. Please try again.');
  }
}

// walk-ins
function showTechSection() {
  if (currentUser.role !== 'technician') return;
  document.getElementById('technicianSection').style.display = 'block';
  showWalkInForm();
}

function showWalkInForm() {
  const section = document.getElementById('walkInSection');
  section.innerHTML = '';
  walkInSlots = [];

  const card = document.createElement('div');
  card.className = 'walkins';
  card.innerHTML = `
    <h4>Reserve a Slot for Walk-in Student</h4>

    <div class="walkin-field">
      <label for="walkInName">Student Name:</label>
      <input type="text" id="walkInName" placeholder="Enter student name">
    </div>

    <div class="walkin-field">
      <label for="walkInLab">Select Lab:</label>
      <select id="walkInLab" onchange="showWalkInSlots()">
        <option value="">-- Choose a Lab --</option>
        ${allLabs.map(l => `<option value="${l._id}">${l.name}</option>`).join('')}
      </select>
    </div>

    <div class="walkin-field">
      <label for="walkInDate">Select Date:</label>
      <input type="date" id="walkInDate" onchange="showWalkInSlots()">
    </div>

    <div class="walkin-field" id="walkInSeatField" style="display:none;">
      <label for="walkInSeat">Select Seat (1-10):</label>
      <select id="walkInSeat" onchange="loadWalkInTimeSlots()">
        <option value="">-- Choose Seat --</option>
        ${Array.from({ length: 10 }, (_, i) => `<option value="${i+1}">Seat ${i+1}</option>`).join('')}
      </select>
    </div>

    <div id="walkInSlotsCtn" style="display: none;">
      <label>Select Time Slots:</label>
      <div class="walkin-slots" id="walkInSlots"></div>
    </div>

    <div class="walkin-actions" id="walkInReserveBtn" style="display:none;">
      <button onclick="confirmWalkIn()">Confirm Reservation</button>
      <button class="cancel" onclick="cancelWalkIn()">Clear</button>
    </div>
  `;
  section.appendChild(card);

  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 7);
  const dateInput = document.getElementById('walkInDate');
  dateInput.min = today.toISOString().split('T')[0];
  dateInput.max = maxDate.toISOString().split('T')[0];
}

async function showWalkInSlots() {
  const labId = document.getElementById('walkInLab').value;
  const date = document.getElementById('walkInDate').value;

  if (!labId || !date) {
    document.getElementById('walkInSeatField').style.display = 'none';
    document.getElementById('walkInSlotsCtn').style.display = 'none';
    document.getElementById('walkInReserveBtn').style.display = 'none';
    return;
  }

  document.getElementById('walkInSeatField').style.display = 'block';
  document.getElementById('walkInSlotsCtn').style.display = 'none';
  document.getElementById('walkInReserveBtn').style.display = 'none';
  document.getElementById('walkInSeat').value = '';
}

async function loadWalkInTimeSlots() {
  walkInSlots = [];
  const labId = document.getElementById('walkInLab').value;
  const date = document.getElementById('walkInDate').value;
  const seat = document.getElementById('walkInSeat').value;

  if (!labId || !date || !seat) {
    document.getElementById('walkInSlotsCtn').style.display = 'none';
    document.getElementById('walkInReserveBtn').style.display = 'none';
    return;
  }

  const res = await fetch(`/reservations/slots?labId=${labId}&date=${date}`);
  const { seats } = await res.json();

  const seatData = seats.find(s => s.num === parseInt(seat));
  const takenSlots = seatData ? seatData.taken : [];

  document.getElementById('walkInSlotsCtn').style.display = 'block';
  document.getElementById('walkInReserveBtn').style.display = 'block';
  const container = document.getElementById('walkInSlots');
  container.innerHTML = '';

  generateTimeSlots().forEach(time => {
    const btn = document.createElement('button');
    btn.textContent = time;
    if (takenSlots.includes(time)) {
      btn.disabled = true;
      btn.style.backgroundColor = '#ccc';
      btn.style.color = '#666';
    } else {
      btn.style.backgroundColor = '#90EE90';
      btn.onclick = () => {
        if (walkInSlots.includes(time)) {
          walkInSlots = walkInSlots.filter(t => t !== time);
          btn.classList.remove('selected');
          btn.style.backgroundColor = '#90EE90';
        } else {
          walkInSlots.push(time);
          btn.classList.add('selected');
          btn.style.backgroundColor = 'lightgreen';
        }
      };
    }
    container.appendChild(btn);
  });
}

async function confirmWalkIn() {
  const walkInName = document.getElementById('walkInName').value.trim();
  const labId = document.getElementById('walkInLab').value;
  const date = document.getElementById('walkInDate').value;
  const seat = document.getElementById('walkInSeat').value;

  if (!walkInName || !labId || !date || !seat || walkInSlots.length === 0) {
    alert('Please fill in all fields and select at least one time slot.');
    return;
  }

  try {
    const res = await fetch('/reservations/walkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labId, date, seat: parseInt(seat), slots: walkInSlots, walkInName })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Walk-in reservation failed.'); return; }

    alert(`Reservation for ${walkInName} confirmed!`);
    cancelWalkIn();
    if (viewingReservations) {
      viewingReservations = false;
      await showMyReservations();
    }
  } catch {
    alert('Network error. Please try again.');
  }
}

function cancelWalkIn() {
  showWalkInForm();
}

// reservation stuff
async function toggleReservations() {
  if (viewingReservations) {
    document.getElementById('reservationSection').innerHTML = '';
    viewingReservations = false;
    return;
  }
  await showMyReservations();
}

async function showMyReservations() {
  viewingReservations = true;
  const section = document.getElementById('reservationSection');
  section.innerHTML = '<p>Loading...</p>';

  try {
    const res = await fetch('/reservations');
    const { reservations } = await res.json();
    section.innerHTML = '<h4>All Reservations</h4>';

    if (reservations.length === 0) {
      section.innerHTML += '<p>No reservations found.</p>';
      return;
    }

    reservations.forEach(r => {
      const div = document.createElement('div');
      div.className = 'reservation';

      const isTech = currentUser.role === 'technician';

      const profileLink = r.ownerEmail
        ? `<a href="/profile?email=${r.ownerEmail}" style="color:#00693e;">View Profile</a>`
        : '';

      div.innerHTML = `
        <p><strong>Reserved By:</strong> ${r.displayName} ${profileLink}</p>
        <p><strong>Lab:</strong> ${r.lab.name}</p>
        <p><strong>Seat:</strong> ${r.seat}</p>
        <p><strong>Date Reserved:</strong> ${r.date}</p>
        <p><strong>Slots:</strong> ${r.slots.join(', ')}</p>
        <p><strong>Requested At:</strong> ${new Date(r.requestTime).toLocaleString()}</p>
        ${r.createdBy ? `<p><strong>Booked by technician:</strong> ${r.createdBy}</p>` : ''}
        ${r.isOwner || isTech ? `<button onclick="editReservation('${r._id}', '${r.date}', ${r.seat}, '${r.slots.join(', ')}')">Edit</button>` : ''}
        ${isTech ? `<button onclick="removeReservation('${r._id}')">Remove</button>` : ''}
        <hr>
      `;
      section.appendChild(div);
    });
  } catch {
    section.innerHTML = '<p>Failed to load reservations.</p>';
  }
}

async function editReservation(id, currentDate, currentSeat, currentSlots) {
  const slotsArray = currentSlots ? currentSlots.split(', ') : [];
  
  const newDate = prompt('Enter new date (YYYY-MM-DD):', currentDate);
  if (!newDate) return;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
    alert('Invalid date format. Use YYYY-MM-DD.');
    return;
  }

  const newSeat = prompt('Enter new seat number (1-10):', currentSeat);
  if (!newSeat) return;
  
  const seatNum = parseInt(newSeat);
  if (seatNum < 1 || seatNum > 10) {
    alert('Seat must be between 1 and 10.');
    return;
  }

  const newSlots = prompt('Enter new time slots (comma-separated, e.g., 09:00,10:00):', slotsArray.join(', '));
  if (!newSlots) return;
  
  const slotsArray_new = newSlots.split(',').map(s => s.trim());
  
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  for (let slot of slotsArray_new) {
    if (!timeRegex.test(slot)) {
      alert('Invalid time format. Use HH:MM (e.g., 09:00, 10:30)');
      return;
    }
  }

  try {
    const res = await fetch(`/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        date: newDate, 
        seat: seatNum,
        slots: slotsArray_new 
      })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Update failed.'); return; }
    alert('Reservation updated.');
    viewingReservations = false;
    await showMyReservations();
  } catch {
    alert('Network error. Please try again.');
  }
}

async function removeReservation(id) {
  if (!confirm('Remove this reservation?')) return;

  try {
    const res = await fetch(`/reservations/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Removal failed.'); return; }
    alert('Reservation removed.');
    viewingReservations = false;
    await showMyReservations();
  } catch {
    alert('Network error. Please try again.');
  }
}