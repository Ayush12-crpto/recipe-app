// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 🔧 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCZ6zji5AeN6XH3j_6-SvGclzpcejwREaE",
  authDomain: "login-9be9e.firebaseapp.com",
  projectId: "login-9be9e",
  storageBucket: "login-9be9e.firebasestorage.app",
  messagingSenderId: "436921507068",
  appId: "1:436921507068:web:eb039fcb3cd9b8e47dcb79"
};


// 🔧 Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🟢 Global variable to track logged-in userId
let currentUserId = null;

// ✅ Auth State Listener (Tracks login/logout automatically)
onAuthStateChanged(auth, user => {
  if (user) {
    currentUserId = user.uid;
    console.log(`✅ User logged in: ${user.email}`);
  } else {
    currentUserId = null;
    console.log("⚠️ No user logged in");
  }
});

// ✅ Sign Up
document.getElementById('signupBtn').addEventListener('click', async () => {
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const dietPreference = document.getElementById('signupDiet').value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save additional user data in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: name,
      email: email,
      preferences: {
        diet: dietPreference,
        allergies: ""
      }
    });

    alert("✅ Sign up successful!");
  } catch (error) {
    console.error("❌ Signup Error:", error.message);
    alert(error.message);
  }
});

// ✅ Login
document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    currentUserId = user.uid; // Set current user id after login

    // Fetch user data from Firestore
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      alert(`✅ Welcome back ${userData.name}! Your diet preference is ${userData.preferences.diet}.`);
    } else {
      console.log("⚠️ No user document found in Firestore.");
    }

  } catch (error) {
    console.error("❌ Login Error:", error.message);
    alert(error.message);
  }
});

// ✅ Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    await signOut(auth);
    currentUserId = null; // Clear the global user id
    alert("✅ Logged out successfully!");
  } catch (error) {
    console.error("❌ Logout Error:", error.message);
  }
});

// ✅ Recipe Form (Sending Data to Flask Backend)
document.getElementById('recipeForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const ingredients = document.getElementById('ingredients').value;
  const diet = document.getElementById('diet').value;

  // Check if user is logged in before sending recipe request
  if (!currentUserId) {
    alert("⚠️ You must be logged in to generate a recipe!");
    return;
  }

  try {
    const response = await fetch('http://127.0.0.1:5000/generate-recipe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: currentUserId,  // ✅ Send userId to backend
        ingredients: ingredients,
        diet: diet
      })
    });

    const data = await response.json();

    // ✅ Handle backend response
    const resultDiv = document.getElementById('result');

    if (data.recipe) {
      resultDiv.innerHTML = `
        <h3>🍽️ Generated Recipe!</h3>
        <p>${data.recipe}</p>
      `;
    } else {
      console.error("❌ Error:", data.error);
      resultDiv.innerHTML = `<p style="color: red;">Error: ${data.error}</p>`;
    }

  } catch (error) {
    console.error("❌ Error fetching recipe:", error);
    alert("Error fetching recipe. Check console for details.");
  }
});
