import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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
export const auth = getAuth(app);

// Sign up
export async function signUp(email, password) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

// Log in
export async function logIn(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

// Log out
export async function logOut() {
  await signOut(auth);
}

// Listen for auth state changes (who's logged in)
export function onAuthChange(callback) {
  onAuthStateChanged(auth, callback);
}

// Save a recipe to Firestore
export async function saveRecipe(recipe, userId) {
  const id = recipe.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
  await setDoc(doc(db, "recipes", id), {
    ...recipe,
    id,
    createdBy: userId,
    createdAt: new Date().toISOString()
  });
  return id;
}

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