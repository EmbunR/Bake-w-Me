import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDn5hvOZzhQCKY-I8WoExjstcQARHLBPkc",
  authDomain: "bake-w-me.firebaseapp.com",
  projectId: "bake-w-me",
  storageBucket: "bake-w-me.firebasestorage.app",
  messagingSenderId: "238753183303",
  appId: "1:238753183303:web:9b2ede61e737c14f602362"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fetch all recipes (for home screen cards)
export async function getAllRecipes() {
  const snapshot = await getDocs(collection(db, "recipes"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Fetch one recipe by ID (for the step-by-step screen)
export async function getRecipeById(id) {
  const snapshot = await getDoc(doc(db, "recipes", id));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}