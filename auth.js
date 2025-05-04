import { db, ref, get, set, child } from './firebase.js';

// Very basic hash — replace with bcrypt for real use
function hashPassword(pw) {
  let hash = 0;
  for (let i = 0; i < pw.length; i++) {
    hash = (hash << 5) - hash + pw.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
}

// Handle login
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const inputHash = hashPassword(password);

    const userRef = ref(db);

    try {
      const userSnap = await get(child(userRef, `users/${username}`));

      if (!userSnap.exists()) {
        // Create new user record
        await set(ref(db, `users/${username}`), {
          passwordHash: inputHash,
          boards: {}
        });
        localStorage.setItem("bingoUser", username);
        window.location.href = "dashboard.html";
        return;
      }

      const user = userSnap.val();
      if (user.passwordHash === inputHash) {
        localStorage.setItem("bingoUser", username);
        window.location.href = "dashboard.html";
      } else {
        showError("Incorrect password.");
      }

    } catch (err) {
      console.error(err);
      showError("Login error. Please try again.");
    }
  });
}

// Handle logout
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("bingoUser");
    window.location.href = "index.html";
  });
}

// Show user greeting
const welcome = document.getElementById("welcome");
if (welcome) {
  const user = localStorage.getItem("bingoUser");
  if (!user) {
    window.location.href = "index.html";
  } else {
    welcome.textContent = `Hi, ${user}!`;
  }
}

function showError(msg) {
  const errorP = document.getElementById("login-error");
  if (errorP) {
    errorP.textContent = msg;
  } else {
    alert(msg);
  }
}
