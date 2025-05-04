import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getDatabase, ref, set, get, child, remove } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAK3NIMej9MomNZciXqgO0zXvP2LT5l2Wk",
    authDomain: "bingo-47a4f.firebaseapp.com",
    databaseURL: "https://bingo-47a4f-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bingo-47a4f",
    storageBucket: "bingo-47a4f.firebasestorage.app",
    messagingSenderId: "956768565428",
    appId: "1:956768565428:web:3eb06937e6f50002473fe1",
    measurementId: "G-WW9EQ5D3DP"
  };

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, get, child, remove };
