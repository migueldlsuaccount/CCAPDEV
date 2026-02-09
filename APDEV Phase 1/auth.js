let users = JSON.parse(localStorage.getItem("users")) || [
  {
    name: "Miguel Sybingco",
    email: "miguel@dlsu.edu.ph",
    password: "1234",
    role: "student"
  },
  {
    name: "Ian Jamero",
    email: "ian@dlsu.edu.ph",
    password: "1234",
    role: "student"
  },
  {
    name: "John Christian Llamas",
    email: "john@dlsu.edu.ph",
    password: "1234",
    role: "student"
  },
  {
    name: "Ethan Sia",
    email: "ethan@dlsu.edu.ph",
    password: "1234",
    role: "student"
  },
  {
    name: "Lab Tech Ramon",
    email: "tech@dlsu.edu.ph",
    password: "admin",
    role: "technician"
  },
  {
    name: "Lab Tech Joe",
    email: "tech2@dlsu.edu.ph",
    password: "admin",
    role: "technician"
  }
];

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const remember = document.getElementById("remember")?.checked;

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    document.getElementById("errorMsg").style.display = "block";
    return;
  }

  const storage = remember ? localStorage : sessionStorage;
  storage.setItem("currentUser", JSON.stringify(user));

  //window.location.href = "index.html";
  window.location.href = "main.html";
}

function register() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  if (!name || !email || !password) {
    document.getElementById("errorMsg").style.display = "block";
    return;
  }

  if (users.some(u => u.email === email)) {
    document.getElementById("errorMsg").innerText = "Email already exists";
    document.getElementById("errorMsg").style.display = "block";
    return;
  }

  users.push({ name, email, password, role });
  localStorage.setItem("users", JSON.stringify(users));

  alert("Registration successful!");
  window.location.href = "login.html";

}
