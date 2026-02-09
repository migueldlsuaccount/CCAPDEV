const storedUser =
  localStorage.getItem("currentUser") ||
  sessionStorage.getItem("currentUser");

if (!storedUser) {
  window.location.href = "login.html";
}


const currentUser = JSON.parse(storedUser);

function logout() {
  localStorage.removeItem("currentUser");
  sessionStorage.removeItem("currentUser");
  window.location.href = "login.html";
}