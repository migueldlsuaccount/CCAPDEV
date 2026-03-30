let currentUser = null;
let isEditing = false;

const urlParams = new URLSearchParams(window.location.search);
const viewingEmail = urlParams.get('email');

(async () => {
  try {
    const res = await fetch('/auth/me');
    if (!res.ok) { window.location.href = '/login'; return; }
    currentUser = (await res.json()).user;
    await initProfile();
  } catch {
    window.location.href = '/login';
  }
})();

async function initProfile() {
  const container = document.getElementById('profileContainer');

  if (viewingEmail && viewingEmail !== currentUser.email) {
    try {
      const res = await fetch(`/users/by-email/${encodeURIComponent(viewingEmail)}`);
      if (!res.ok) { container.innerHTML = '<p>User not found.</p>'; return; }
      const { user } = await res.json();
      displayPublicProfile(user);
    } catch {
      container.innerHTML = '<p>Failed to load profile.</p>';
    }
  } else {
    await displayOwnProfile();
  }
}

function displayPublicProfile(user) {
  const container = document.getElementById('profileContainer');
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

async function displayOwnProfile() {
  if (isEditing) {
    displayEditProfile(currentUser);
  } else {
    await displayViewProfile(currentUser);
  }
}

async function displayViewProfile(user) {
  const container = document.getElementById('profileContainer');

  let reservationsHtml = '<p>No reservations found.</p>';
  try {
    const res = await fetch(`/users/${user._id}/reservations`);
    const { reservations } = await res.json();
    if (reservations.length > 0) {
      reservationsHtml = reservations.map(r => `
        <div class="reservation-item">
          <p><strong>Lab:</strong> ${r.lab.name}</p>
          <p><strong>Date:</strong> ${r.date}</p>
          <p><strong>Slots:</strong> ${r.slots.join(', ')}</p>
          <p><strong>Requested At:</strong> ${new Date(r.requestTime).toLocaleString()}</p>
        </div>
      `).join('');
    }
  } catch {
    reservationsHtml = '<p>Failed to load reservations.</p>';
  }

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
        ${reservationsHtml}
      </div>
    </div>
  `;
}

function displayEditProfile(user) {
  const container = document.getElementById('profileContainer');
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

function toggleEditProfile() {
  isEditing = !isEditing;
  displayOwnProfile();
}

async function saveProfile() {
  const picture = document.getElementById('editPicture').value.trim();
  const description = document.getElementById('editDescription').value.trim();

  if (!picture || !description) {
    alert('Please fill in all fields.');
    return;
  }

  try {
    const res = await fetch(`/users/${currentUser._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ picture, description })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Update failed.'); return; }

    currentUser.picture = data.user.picture;
    currentUser.description = data.user.description;

    alert('Profile updated successfully!');
    isEditing = false;
    await displayOwnProfile();
  } catch {
    alert('Network error. Please try again.');
  }
}

async function deleteAccount() {
  const confirmed = confirm(
    'Are you sure you want to delete your account? This will also cancel all your reservations. This cannot be undone.'
  );
  if (!confirmed) return;

  try {
    const res = await fetch(`/users/${currentUser._id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Deletion failed.'); return; }
    alert('Account deleted successfully.');
    window.location.href = '/login';
  } catch {
    alert('Network error. Please try again.');
  }
}

async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  window.location.href = '/login';
}

function goBack() {
  window.location.href = '/';
}
