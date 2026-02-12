let selectedSlots = [];
let viewingReservations = false;

const storedUser =
  localStorage.getItem("currentUser") ||
  sessionStorage.getItem("currentUser");

if (!storedUser) {
  window.location.href = "login.html";
}

const currentUser = JSON.parse(storedUser);

document.getElementById("userInfo").textContent =
  `Logged in as: ${currentUser.name} (${currentUser.role})`;

function logout() {
  localStorage.removeItem("currentUser");
  sessionStorage.removeItem("currentUser");
  window.location.href = "login.html";
}


const labs = [
  { id: 1, name: "Computer Lab A"},
  { id: 2, name: "Computer Lab B"},
  { id: 3, name: "Computer Lab C"}
];

let reservations = JSON.parse(localStorage.getItem("reservations")) || [];

//show labs

function displayLabs() {
  document.getElementById("labContainer").innerHTML = "";

  labs.forEach(lab => {
    const div = document.createElement("div");
    div.className = "lab";
    div.innerHTML = `
      <h4>${lab.name}</h4>
      <button onclick="viewSlots(${lab.id})">View Slots</button>
    `;
    document.getElementById("labContainer").appendChild(div);
  });
}

displayLabs();

//time slots

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

//show slots

function viewSlots(labId) {
  selectedSlots = [];

  const lab = labs.find(l => l.id === labId);
  const slotSection = document.getElementById("slotSection");
  slotSection.innerHTML = "";

  const title = document.createElement("h4");
  title.textContent = `${lab.name} - Select Slots`;
  slotSection.appendChild(title);

  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.id = "resDate";
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 7);

  dateInput.min = today.toISOString().split("T")[0];
  dateInput.max = maxDate.toISOString().split("T")[0];

  dateInput.onchange = () => renderSlots(labId);
  slotSection.appendChild(dateInput);

  slotSection.appendChild(document.createElement("br"));
  slotSection.appendChild(document.createElement("br"));

  const anonLabel = document.createElement("label");
  anonLabel.innerHTML = `<input type="checkbox" id="anonymous"> Reserve Anonymously`;
  slotSection.appendChild(anonLabel);

  slotSection.appendChild(document.createElement("br"));
  slotSection.appendChild(document.createElement("br"));

  const slotContainer = document.createElement("div");
  slotContainer.id = "slotButtons";
  slotSection.appendChild(slotContainer);

  const confirmBtn = document.createElement("button");
  confirmBtn.textContent = "Confirm Reservation";
  confirmBtn.onclick = () => confirmReservation(labId);
  slotSection.appendChild(document.createElement("br"));
  slotSection.appendChild(confirmBtn);
}

function renderSlots(labId) {
  selectedSlots = [];

  const date = document.getElementById("resDate").value;
  if (!date) return;

  const container = document.getElementById("slotButtons");
  container.innerHTML = "";

  //generate buttons for each time period
  generateTimeSlots().forEach(time => {
    const button = document.createElement("button");
    button.textContent = time;

    const reserved = reservations.some(r =>
      r.labId === labId &&
      r.date === date &&
      r.slots.includes(time)
    );
    //block reserve slots
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
    // Deselect
    selectedSlots = selectedSlots.filter(t => t !== time);
    buttonElement.style.backgroundColor = "";
  } else {
    selectedSlots.push(time);
    buttonElement.style.backgroundColor = "lightgreen";
  }
}

function confirmReservation(labId) {
  if (selectedSlots.length === 0) {
    alert("No slots selected.");
    return;
  }

  const date = document.getElementById("resDate").value;

  if (!date) {
    alert("Please select a date.");
    return;
  }

  const anonymous = document.getElementById("anonymous").checked;

  const reservation = {
    id: Date.now(),
    labId,
    labName: labs.find(l => l.id === labId).name,
    user: anonymous ? "Anonymous" : currentUser.name,
    owner: currentUser.name,
    role: currentUser.role,
    date,
    slots: [...selectedSlots],
    requestTime: new Date().toLocaleString()
  };

  reservations.push(reservation);
  localStorage.setItem("reservations", JSON.stringify(reservations));

  selectedSlots = [];

  alert("Reservation Successful!");

  document.getElementById("slotSection").innerHTML = "";

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


    /* Reserved By: (Name)
       Lab:
       Date Reserved:
       Requested At:
       Edit and Remove (remove if technician)
    */
    div.innerHTML = `
      <p><strong>Reserved By:</strong> ${r.user}</p>     
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
  //10 mins before
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

//edit date

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
    r.id !== id &&                           // not the same reservation
    r.labId === reservation.labId &&         // same lab
    r.date === newDate &&                    // same date
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