const storedUser =
  localStorage.getItem("currentUser") ||
  sessionStorage.getItem("currentUser");

if (!storedUser) {
  window.location.href = "login.html";
}

const currentUser = JSON.parse(storedUser);
// show current user in header.
document.getElementById("userInfo").textContent = `Logged in as: ${currentUser.name} (${currentUser.role})`;

function logout() {
  localStorage.removeItem("currentUser");
  sessionStorage.removeItem("currentUser");
  window.location.href = "login.html";
}


// labs
const labs = [
  { id: 1, name: "Computer Lab A", capacity: 20 },
  { id: 2, name: "Computer Lab B", capacity: 15 },
  { id: 3, name: "Computer Lab C", capacity: 25 }
];

function displayLabs() {
  document.getElementById("labContainer").innerHTML = "";
  labs.forEach(lab => {
    const labDiv = document.createElement("div");
    labDiv.className = "lab";
    labDiv.innerHTML = `
      <h4>${lab.name}</h4>
      <p>Capacity: ${lab.capacity}</p>
      <button onclick="viewSlots(${lab.id})">View Slots</button>`;
    document.getElementById("labContainer").appendChild(labDiv);
  });
}
displayLabs();