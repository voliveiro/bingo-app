import { db, ref, set, get, remove, child } from './firebase.js';

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function updateItemCount() {
  const textarea = document.getElementById("bingo-items");
  const counter = document.getElementById("item-count");
  if (!textarea || !counter) return;
  const lines = textarea.value.split("\n").filter(line => line.trim() !== "");
  counter.textContent = `${lines.length} item${lines.length !== 1 ? "s" : ""} entered`;
}

function createBingo() {
  const title = document.getElementById('bingo-title').value.trim();
  let items = document.getElementById('bingo-items').value
    .trim()
    .split('\n')
    .map(i => i.trim())
    .filter(Boolean);
  const boardIdInput = document.getElementById("current-board-id");
  const existingId = boardIdInput.value;

  if (items.length < 25) {
    alert("Please enter at least 25 items!");
    return;
  }

  const username = localStorage.getItem("bingoUser");
  if (!username) {
    alert("You must be logged in.");
    return;
  }

  items = shuffle(items).slice(0, 25);
  const id = existingId || Math.random().toString(36).substring(2, 8);
  const data = { title, items, owner: username };
  const boardRef = ref(db, `boards/${id}`);
  const userBoardRef = ref(db, `users/${username}/boards/${id}`);

  set(boardRef, data)
    .then(() => set(userBoardRef, true))
    .then(() => {
      boardIdInput.value = "";
      const link = `${window.location.origin}/board.html?id=${id}`;
      navigator.clipboard.writeText(link)
        .then(() => alert("Board saved! Link copied to clipboard."))
        .catch(() => alert(`Board saved! Here’s your link:\n${link}`));
      window.location.href = `board.html?id=${id}`;
    });
}

function getBoardId() {
  const url = new URL(window.location.href);
  return url.searchParams.get("id");
}

function loadBoard() {
  const id = getBoardId();
  const dbRef = ref(db);

  get(child(dbRef, `boards/${id}`)).then((snapshot) => {
    if (snapshot.exists()) {
      const { title, items } = snapshot.val();
      document.getElementById("board-title").innerText = title;

      const grid = document.getElementById("bingo-grid");
      const shuffledItems = shuffle([...items]);
      const cellStates = Array(25).fill(false);
      let bingoAchieved = false;

      shuffledItems.forEach((item, index) => {
        const cell = document.createElement("div");
        cell.innerText = item;
        cell.dataset.index = index;
        cell.onclick = () => {
          if (bingoAchieved) return;
          cell.classList.toggle("clicked");
          cellStates[index] = cell.classList.contains("clicked");

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setTimeout(() => {
                if (checkForBingo(cellStates)) {
                  bingoAchieved = true;
                }
              }, 0);
            });
          });
        };
        grid.appendChild(cell);
      });
    } else {
      alert("Board not found");
    }
  });
}

function checkForBingo(states) {
  const size = 5;

  for (let r = 0; r < size; r++) {
    const row = states.slice(r * size, r * size + size);
    if (row.every(Boolean)) {
      showBingoBanner("🎉 BINGO! You completed a row!");
      return true;
    }
  }

  for (let c = 0; c < size; c++) {
    const col = [0, 1, 2, 3, 4].map(i => states[i * size + c]);
    if (col.every(Boolean)) {
      showBingoBanner("🎉 BINGO! You completed a column!");
      return true;
    }
  }

  const diag1 = [0, 6, 12, 18, 24].map(i => states[i]);
  const diag2 = [4, 8, 12, 16, 20].map(i => states[i]);

  if (diag1.every(Boolean) || diag2.every(Boolean)) {
    showBingoBanner("🎉 BINGO! You completed a diagonal!");
    return true;
  }

  return false;
}

function showBingoBanner(message) {
  const banner = document.getElementById("bingo-banner");
  if (banner) {
    banner.textContent = message;
    banner.style.display = "block";
    banner.style.background = "#ffeb3b";
    banner.style.padding = "12px";
    banner.style.fontSize = "24px";
    banner.style.textAlign = "center";
    banner.style.borderRadius = "10px";
    banner.style.marginBottom = "12px";
  }
}

function loadUserBoards() {
  const username = localStorage.getItem("bingoUser");
  const boardList = document.getElementById("board-list");
  if (!username || !boardList) return;

  const dbRef = ref(db);
  get(child(dbRef, `users/${username}/boards`)).then((snapshot) => {
    if (!snapshot.exists()) return;
    const boardIds = Object.keys(snapshot.val());
    boardList.innerHTML = "";

    boardIds.forEach((id) => {
      get(child(dbRef, `boards/${id}`)).then((boardSnap) => {
        if (boardSnap.exists()) {
          const data = boardSnap.val();
          const container = document.createElement("div");
          container.className = "board-actions";

          const link = document.createElement("a");
          link.href = `board.html?id=${id}`;
          link.textContent = data.title || "Untitled Board";
          link.className = "board-link";

          const editBtn = document.createElement("button");
          editBtn.textContent = "Edit";
          editBtn.onclick = () => {
            document.getElementById("bingo-title").value = data.title;
            document.getElementById("bingo-items").value = data.items.join("\n");
            document.getElementById("current-board-id").value = id;
            updateItemCount();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          };

          const deleteBtn = document.createElement("button");
          deleteBtn.textContent = "Delete";
          deleteBtn.onclick = async () => {
            if (confirm("Are you sure you want to delete this board?")) {
              await remove(ref(db, `boards/${id}`));
              await remove(ref(db, `users/${username}/boards/${id}`));
              loadUserBoards();
            }
          };

          container.appendChild(link);
          container.appendChild(editBtn);
          container.appendChild(deleteBtn);
          boardList.appendChild(container);
        }
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const isDashboard = document.getElementById("generate-btn") !== null;
  const isBoard = window.location.pathname.includes("board.html");

  if (isDashboard) {
    const textarea = document.getElementById("bingo-items");
    const button = document.getElementById("generate-btn");

    if (!localStorage.getItem("bingoUser")) {
      window.location.href = "index.html";
    }

    if (textarea) {
      textarea.addEventListener("input", updateItemCount);
      textarea.addEventListener("keyup", updateItemCount);
      updateItemCount();
    }

    if (button) {
      button.addEventListener("click", createBingo);
    }

    loadUserBoards();
  }

  if (isBoard) {
    loadBoard();
  }
});