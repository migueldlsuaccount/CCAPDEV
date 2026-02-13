const storedUser =
  localStorage.getItem("currentUser") ||
  sessionStorage.getItem("currentUser");

if (!storedUser) {
  window.location.href = "login.html";
}

const currentUser = JSON.parse(storedUser);
let users = JSON.parse(localStorage.getItem("users"));
let reservations = JSON.parse(localStorage.getItem("reservations")) || [];
let isEditing = false;
let viewingUser = null;

const urlParams = new URLSearchParams(window.location.search);
const viewingEmail = urlParams.get("email");

function initProfile() {
  const container = document.getElementById("profileContainer");
  
  if (viewingEmail && viewingEmail !== currentUser.email) {
    const userToView = users.find(u => u.email === viewingEmail);
    if (!userToView) {
      container.innerHTML = "<p>User not found.</p>";
      return;
    }
    viewingUser = userToView;
    displayPublicProfile(userToView);
  } else {
    displayOwnProfile(currentUser);
  }
}

function displayPublicProfile(user) {
  const container = document.getElementById("profileContainer");
  container.innerHTML = `
    <div class="profile-card">
      <img src="${user.picture}" alt="${user.name}">
      <h3>${user.name}</h3>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Role:</strong> ${user.role}</p>
      <p><strong>Description:</strong></p>
      <p>${user.description}</p>
    </div>
  `;
}

function displayOwnProfile(user) {
  const container = document.getElementById("profileContainer");
  
  if (isEditing) {
    displayEditProfile(user);
  } else {
    displayViewProfile(user);
  }
}

function displayViewProfile(user) {
  const container = document.getElementById("profileContainer");
  const userReservations = reservations.filter(r => r.owner === user.name);
  
  container.innerHTML = `
    <div class="profile-card">
      <img src="${user.picture}" alt="${user.name}">
      <h3>${user.name}</h3>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Role:</strong> ${user.role}</p>
      <p><strong>Description:</strong></p>
      <p>${user.description}</p>
      
      <div class="profile-actions">
        <button onclick="toggleEditProfile()">Edit Profile</button>
        <button class="danger-btn" onclick="deleteAccount()">Delete Account</button>
      </div>

      <div class="profile-reservations">
        <h4>Your Reservations</h4>
        ${displayReservations(userReservations)}
      </div>
    </div>
  `;
}

function displayEditProfile(user) {
  const container = document.getElementById("profileContainer");
  container.innerHTML = `
    <div class="profile-card">
      <h3>Edit Profile</h3>
      
      <div class="profile-field">
        <label for="editName">Name:</label>
        <input type="text" id="editName" value="${user.name}" readonly>
      </div>

      <div class="profile-field">
        <label for="editEmail">Email:</label>
        <input type="email" id="editEmail" value="${user.email}" readonly>
      </div>

      <div class="profile-field">
        <label for="editPicture">Profile Picture URL:</label>
        <input type="text" id="editPicture" value="${user.picture}">
      </div>

      <div class="profile-field">
        <label for="editDescription">Description:</label>
        <textarea id="editDescription">${user.description}</textarea>
      </div>

      <div class="profile-actions">
        <button onclick="saveProfile()">Save Changes</button>
        <button onclick="toggleEditProfile()">Cancel</button>
      </div>
    </div>
  `;
}

function displayReservations(userReservations) {
  if (userReservations.length === 0) {
    return "<p>No reservations found.</p>";
  }

  let html = "";
  userReservations.forEach(r => {
    html += `
      <div class="reservation-item">
        <p><strong>Lab:</strong> ${r.labName}</p>
        <p><strong>Date:</strong> ${r.date}</p>
        <p><strong>Slots:</strong> ${r.slots.join(", ")}</p>
        <p><strong>Requested At:</strong> ${r.requestTime}</p>
      </div>
    `;
  });
  return html;
}

function toggleEditProfile() {
  isEditing = !isEditing;
  displayOwnProfile(currentUser);
}

function saveProfile() {
  const newPicture = document.getElementById("editPicture").value;
  const newDescription = document.getElementById("editDescription").value;

  if (!newPicture || !newDescription) {
    alert("Please fill in all fields.");
    return;
  }

  // Update current user
  currentUser.picture = newPicture;
  currentUser.description = newDescription;

  // Update in users array
  const userIndex = users.findIndex(u => u.email === currentUser.email);
  if (userIndex !== -1) {
    users[userIndex].picture = newPicture;
    users[userIndex].description = newDescription;
  }

  // Save to localStorage
  localStorage.setItem("users", JSON.stringify(users));
  const storage = localStorage.getItem("currentUser") ? localStorage : sessionStorage;
  storage.setItem("currentUser", JSON.stringify(currentUser));

  alert("Profile updated successfully!");
  isEditing = false;
  displayOwnProfile(currentUser);
}

function deleteAccount() {
  const confirmDelete = confirm(
    "Are you sure you want to delete your account? This will also cancel all your pending reservations. This action cannot be undone."
  );

  if (!confirmDelete) {
    return;
  }

  // Remove user from users array
  users = users.filter(u => u.email !== currentUser.email);
  localStorage.setItem("users", JSON.stringify(users));

  // Remove user's reservations
  reservations = reservations.filter(r => r.owner !== currentUser.name);
  localStorage.setItem("reservations", JSON.stringify(reservations));

  // Clear authentication
  localStorage.removeItem("currentUser");
  sessionStorage.removeItem("currentUser");

  alert("Account deleted successfully.");
  window.location.href = "login.html";
}

function logout() {
  localStorage.removeItem("currentUser");
  sessionStorage.removeItem("currentUser");
  window.location.href = "login.html";
}

function goBack() {
  window.location.href = "main.html";
}

// Initialize the profile page
initProfile();
