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

  // Only show the reservation form for students
  // Technicians use the walk-in form instead
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

      <div id="slotButtonsContainer" style="display:none;">
        <label>Select Time Slots:</label>
        <div id="slotButtons" class="walkin-slots"></div>
      </div>

      <div class="walkin-field">
        <label style="display:flex; align-items:right; gap:0.5rem; font-weight:normal;">
          <input type="checkbox" id="anonymousReservation">
          Reserve anonymously
        </label>
      </div>

      <div class="walkin-actions">
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

// slot select (student)
async function handleLabSelection() {
  const labId = document.getElementById('labSelect').value;
  const date = document.getElementById('resDate').value;

  if (!labId || !date) {
    document.getElementById('slotButtonsContainer').style.display = 'none';
    return;
  }

  selectedSlots = [];

  const res = await fetch(`/reservations/slots?labId=${labId}&date=${date}`);
  const { takenSlots } = await res.json();

  const container = document.getElementById('slotButtons');
  container.innerHTML = '';
  document.getElementById('slotButtonsContainer').style.display = 'block';

  generateTimeSlots().forEach(time => {
    const btn = document.createElement('button');
    btn.textContent = time;
    if (takenSlots.includes(time)) {
      btn.disabled = true;
      btn.style.backgroundColor = '#ccc';
    } else {
      btn.onclick = () => {
        if (selectedSlots.includes(time)) {
          selectedSlots = selectedSlots.filter(t => t !== time);
          btn.classList.remove('selected');
          btn.style.backgroundColor = '';
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
  const anonymous = document.getElementById('anonymousReservation')?.checked || false;

  if (!labId) { alert('Please select a lab.'); return; }
  if (!date) { alert('Please select a date.'); return; }
  if (selectedSlots.length === 0) { alert('Please select at least one time slot.'); return; }

  try {
    const res = await fetch('/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labId, date, slots: selectedSlots, anonymous })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Reservation failed.'); return; }

    alert('Reservation Successful!');
    selectedSlots = [];
    await displayLabs();
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

    <div id="walkInSlotsCtn" style="display: none;">
      <label>Select Time Slots:</label>
      <div class="walkin-slots" id="walkInSlots"></div>
    </div>

    <div class="walkin-actions">
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
  walkInSlots = [];
  const labId = document.getElementById('walkInLab').value;
  const date = document.getElementById('walkInDate').value;

  if (!labId || !date) {
    document.getElementById('walkInSlotsCtn').style.display = 'none';
    return;
  }

  const res = await fetch(`/reservations/slots?labId=${labId}&date=${date}`);
  const { takenSlots } = await res.json();

  document.getElementById('walkInSlotsCtn').style.display = 'block';
  const container = document.getElementById('walkInSlots');
  container.innerHTML = '';

  generateTimeSlots().forEach(time => {
    const btn = document.createElement('button');
    btn.textContent = time;
    if (takenSlots.includes(time)) {
      btn.disabled = true;
      btn.style.backgroundColor = '#ccc';
    } else {
      btn.onclick = () => {
        if (walkInSlots.includes(time)) {
          walkInSlots = walkInSlots.filter(t => t !== time);
          btn.classList.remove('selected');
        } else {
          walkInSlots.push(time);
          btn.classList.add('selected');
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

  if (!walkInName || !labId || !date || walkInSlots.length === 0) {
    alert('Please fill in all fields and select at least one time slot.');
    return;
  }

  try {
    const res = await fetch('/reservations/walkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labId, date, slots: walkInSlots, walkInName })
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

      // isOwner comes from the server, isTech checked client-side for button visibility
      const isTech = currentUser.role === 'technician';

      // Only show profile link if there's a real user email (not a walk-in)
      const profileLink = r.ownerEmail
        ? `<a href="/profile?email=${r.ownerEmail}" style="color:#00693e;">View Profile</a>`
        : '';

      div.innerHTML = `
        <p><strong>Reserved By:</strong> ${r.displayName} ${profileLink}</p>
        <p><strong>Lab:</strong> ${r.lab.name}</p>
        <p><strong>Date Reserved:</strong> ${r.date}</p>
        <p><strong>Slots:</strong> ${r.slots.join(', ')}</p>
        <p><strong>Requested At:</strong> ${new Date(r.requestTime).toLocaleString()}</p>
        ${r.createdBy ? `<p><strong>Booked by technician:</strong> ${r.createdBy}</p>` : ''}
        ${r.isOwner || isTech ? `<button onclick="editReservation('${r._id}', '${r.date}')">Edit</button>` : ''}
        ${isTech ? `<button onclick="removeReservation('${r._id}')">Remove</button>` : ''}
        <hr>
      `;
      section.appendChild(div);
    });
  } catch {
    section.innerHTML = '<p>Failed to load reservations.</p>';
  }
}

async function editReservation(id, currentDate) {
  const newDate = prompt('Enter new date (YYYY-MM-DD):', currentDate);
  if (!newDate) return;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
    alert('Invalid date format. Use YYYY-MM-DD.');
    return;
  }

  try {
    const res = await fetch(`/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: newDate })
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

