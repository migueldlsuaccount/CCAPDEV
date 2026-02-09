const storedUser =
  localStorage.getItem("currentUser") ||
  sessionStorage.getItem("currentUser");

if (!storedUser) {
  window.location.href = "login.html";
}


const currentUser = JSON.parse(storedUser);

if (storedUser) {
  const user = JSON.parse(storedUser);
  document.getElementById("userInfo").textContent = `Logged in as: ${user.name} (${user.role})`;
}

function logout() {
  localStorage.removeItem("currentUser");
  sessionStorage.removeItem("currentUser");
  window.location.href = "login.html";
}