let selectedSlots = [];
let viewingReservations = false;

const storedUser =
  localStorage.getItem("currentUser") ||
  sessionStorage.getItem("currentUser");

if (!storedUser) {
  window.location.href = "login.html";
}

const currentUser = JSON.parse(storedUser);
let users = JSON.parse(localStorage.getItem("users"));

document.getElementById("userInfo").textContent =
  `Logged in as: ${currentUser.name} (${currentUser.role})`;

function logout() {
  localStorage.removeItem("currentUser");
  sessionStorage.removeItem("currentUser");
  window.location.href = "login.html";
}

function goToProfile() {
  window.location.href = "profile.html";
}

function showTechSection() {
  if (currentUser.role === "technician") {
    document.getElementById("technicianSection").style.display = "block";
    showWalkInForm();
  }
}

function showWalkInForm() {
  const section = document.getElementById("walkInSection");
  section.innerHTML = "";

  const card = document.createElement("div");
  card.className = "walkins";

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
        ${labs.map(lab => `<option value="${lab.id}">${lab.name}</option>`).join("")}
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
  
  const dateInput = document.getElementById("walkInDate");
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 7);

  dateInput.min = today.toISOString().split("T")[0];
  dateInput.max = maxDate.toISOString().split("T")[0];
}

let walkInSlots = [];

function showWalkInSlots() {
  walkInSlots = [];
  
  const labId = parseInt(document.getElementById("walkInLab").value);
  const date = document.getElementById("walkInDate").value;

  if (!labId || !date) {
    document.getElementById("walkInSlotsCtn").style.display = "none";
    return;
  }

  document.getElementById("walkInSlotsCtn").style.display = "block";

  const container = document.getElementById("walkInSlots");
  container.innerHTML = "";

  generateTimeSlots().forEach(time => {
    const btn = document.createElement("button");
    btn.textContent = time;

    const reserved = reservations.some(r =>
      r.labId === labId &&
      r.date === date &&
      r.slots.includes(time)
    );

    if (reserved) {
      btn.disabled = true;
      btn.style.backgroundColor = "#ccc";
    } else {
      btn.onclick = () => selectWalkInSlot(time, btn);
    }

    container.appendChild(btn);
  });
}

function selectWalkInSlot(time, btn) {
  if (walkInSlots.includes(time)) {
    walkInSlots = walkInSlots.filter(t => t !== time);
    btn.classList.remove("selected");
  } else {
    walkInSlots.push(time);
    btn.classList.add("selected");
  }
}

function confirmWalkIn() {
  const name = document.getElementById("walkInName").value;
  const labId = parseInt(document.getElementById("walkInLab").value);
  const date = document.getElementById("walkInDate").value;

  if (!name || !labId || !date || walkInSlots.length === 0) {
    alert("Please fill in all fields and select at least one time slot.");
    return;
  }

  const reservation = {
    id: Date.now(),
    labId,
    labName: labs.find(l => l.id === labId).name,
    user: `${name} (Walk-in)`,
    owner: name,
    role: "student",
    date,
    slots: [...walkInSlots],
    requestTime: new Date().toLocaleString(),
    createdBy: currentUser.name
  };

  reservations.push(reservation);
  localStorage.setItem("reservations", JSON.stringify(reservations));

  alert(`Reservation for ${name} confirmed!`);
  cancelWalkIn();
}

function cancelWalkIn() {
  walkInSlots = [];
  document.getElementById("walkInName").value = "";
  document.getElementById("walkInLab").value = "";
  document.getElementById("walkInDate").value = "";
  document.getElementById("walkInSlotsCtn").style.display = "none";
  document.getElementById("walkInSlots").innerHTML = "";
}


const labs = [
  { id: 1, name: "Computer Lab A"},
  { id: 2, name: "Computer Lab B"},
  { id: 3, name: "Computer Lab C"}
];

let reservations = JSON.parse(localStorage.getItem("reservations")) || [];


function displayLabs() {
  if(currentUser.role === "student") {
  const container = document.getElementById("labContainer");
  container.innerHTML = "";

  const card = document.createElement("div");
  card.className = "walkins";

  card.innerHTML = `
    <h4>Reserve a Lab Slot</h4>

    <div class="walkin-field">
      <label for="labSelect">Select Lab:</label>
      <select id="labSelect" onchange="handleLabSelection()">
        <option value="">-- Choose a Lab --</option>
        ${labs.map(lab => `<option value="${lab.id}">${lab.name}</option>`).join("")}
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

    <div class="walkin-actions">
      <button onclick="confirmReservationFromForm()">Confirm Reservation</button>
    </div>
  `;

  container.appendChild(card);

  // 1 week limit
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 7);

  const dateInput = document.getElementById("resDate");
  dateInput.min = today.toISOString().split("T")[0];
  dateInput.max = maxDate.toISOString().split("T")[0];
  }
}


displayLabs();
showTechSection();


function generateTimeSlots() {
  const slots = [];
  let hour = 8;
  let minute = 0;

  while (hour < 18) {
    const time =
      String(hour).padStart(2, "0") + ":" +
      String(minute).padStart(2, "0");

    slots.push(time);

    minute += 30;
    if (minute === 60) {
      minute = 0;
      hour++;
    }
  }

  return slots;
}


function handleLabSelection() {
  const labId = parseInt(document.getElementById("labSelect").value);
  const date = document.getElementById("resDate").value;

  if (!labId || !date) {
    document.getElementById("slotButtonsContainer").style.display = "none";
    return;
  }

  selectedSlots = [];

  const container = document.getElementById("slotButtons");
  container.innerHTML = "";

  document.getElementById("slotButtonsContainer").style.display = "block";

  generateTimeSlots().forEach(time => {
    const button = document.createElement("button");
    button.textContent = time;

    const reserved = reservations.some(r =>
      r.labId === labId &&
      r.date === date &&
      r.slots.includes(time)
    );

    if (reserved) {
      button.disabled = true;
      button.style.backgroundColor = "#ccc";
    } else {
      button.onclick = () => selectSlot(labId, time, button);
    }

    container.appendChild(button);
  });
}


function selectSlot(labId, time, buttonElement) {
  const date = document.getElementById("resDate").value;

  if (!date) {
    alert("Please select a date first.");
    return;
  }

  const alreadyReserved = reservations.some(r =>
    r.labId === labId &&
    r.date === date &&
    r.slots.includes(time)
  );

  if (alreadyReserved) {
    alert("Slot already reserved.");
    return;
  }

  if (selectedSlots.includes(time)) {

    selectedSlots = selectedSlots.filter(t => t !== time);
    buttonElement.style.backgroundColor = "";
  } else {
    selectedSlots.push(time);
    buttonElement.style.backgroundColor = "lightgreen";
  }
}

function confirmReservationFromForm() {
  const labId = parseInt(document.getElementById("labSelect")?.value);
  const date = document.getElementById("resDate")?.value;

  if (!labId) {
    alert("Please select a lab.");
    return;
  }

  if (!date) {
    alert("Please select a date.");
    return;
  }

  if (selectedSlots.length === 0) {
    alert("Please select at least one time slot.");
    return;
  }

  const lab = labs.find(l => l.id === labId);
  if (!lab) {
    alert("Invalid lab selection.");
    return;
  }

  const reservation = {
    id: Date.now(),
    labId: labId,
    labName: lab.name,
    user: currentUser.name,
    owner: currentUser.name,
    role: currentUser.role,
    date: date,
    slots: [...selectedSlots],
    requestTime: new Date().toLocaleString()
  };

  reservations.push(reservation);
  localStorage.setItem("reservations", JSON.stringify(reservations));

  alert("Reservation Successful!");

  selectedSlots = [];

  displayLabs();
  showMyReservations();
}

function showMyReservations() {
  const section = document.getElementById("reservationSection");

  if (viewingReservations) {
    section.innerHTML = "";
    viewingReservations = false;
    return;
  }

  viewingReservations = true;
  section.innerHTML = "<h4>Your Reservations</h4>";

  const userReservations =
    currentUser.role === "technician"
      ? reservations
      : reservations.filter(r => r.owner === currentUser.name);
  if (userReservations.length === 0) {
    section.innerHTML += "<p>No reservations found.</p>";
    return;
  }

  userReservations.forEach(r => {
    const div = document.createElement("div");
    div.className = "reservation";

    const userToFind = users.find(u => u.name === r.owner);
    const profileLink = userToFind ? `<a href="profile.html?email=${userToFind.email}" style="color: #00693e; cursor: pointer;">View Profile</a>` : "";
    

    /* Reserved By: (Name)
       Lab:
       Date Reserved:
       Requested At:
       Edit and Remove (remove if technician)
    */
    div.innerHTML = `
      <p><strong>Reserved By:</strong> ${r.user} ${profileLink}</p>     
      <p><strong>Lab:</strong> ${r.labName}</p>
      <p><strong>Date Reserved:</strong> ${r.date}</p>
      <p><strong>Slots:</strong> ${r.slots.join(", ")}</p>
      <p><strong>Requested At:</strong> ${r.requestTime}</p>
      <button onclick="editReservation(${r.id})">Edit</button>
      ${currentUser.role === "technician"
        ? `<button onclick="removeReservation(${r.id})">Remove</button>`
        : ""}
      <hr>
    `;

    section.appendChild(div);
  });
}


function removeReservation(id) {
  const reservation = reservations.find(r => r.id === id);

  const now = new Date();
  const reservationDateTime = new Date(reservation.date + " " + reservation.slots[0]);
  const diffMinutes = (now - reservationDateTime) / 60000;

  if (diffMinutes > 10) {
    alert("Cannot remove. 10-minute window passed.");
    return;
  }

  reservations = reservations.filter(r => r.id !== id);
  localStorage.setItem("reservations", JSON.stringify(reservations));

  alert("Reservation removed.");
  showMyReservations();
}

function editReservation(id) {
  const reservation = reservations.find(r => r.id === id);

  const newDate = prompt("Enter new date (YYYY-MM-DD):", reservation.date);
  if (!newDate) return;

  const dateCheck = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateCheck.test(newDate)) {
    alert("Invalid date format. Use YYYY-MM-DD.");
    return;
  }

  // check for schedule conflicts
  const conflict = reservations.some(r =>
    r.id !== id &&                                         //same reservation
    r.labId === reservation.labId &&                       //same lab
    r.date === newDate &&                                  // same date
    r.slots.some(slot => reservation.slots.includes(slot)) // overlapping slot
  );

  if (conflict) {
    alert("Cannot change date. One or more selected time slots are already reserved in this lab.");
    return;
  }

  // if no conflict update
  reservation.date = newDate;
  localStorage.setItem("reservations", JSON.stringify(reservations));

  alert("Reservation updated.");
  showMyReservations();
}