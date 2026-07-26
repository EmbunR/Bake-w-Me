import { getAllRecipes, getRecipeById, signUp, logIn, logOut, onAuthChange, saveRecipe } from "./firebase.js";

// ─── State ───────────────────────────────────────────────────────────────────
let currentRecipe = null;
let currentStepIndex = 0;
let currentUser = null;
let authMode = "login";
let stepCount = 0;

// Timer state
let timerInterval = null;
let timerSecondsLeft = 0;
let timerRunning = false;

// ─── Auth State ───────────────────────────────────────────────────────────────
onAuthChange((user) => {
  currentUser = user;
  if (user) {
    document.getElementById("nav-login").style.display = "none";
    document.getElementById("nav-logout").style.display = "inline";
    document.getElementById("nav-add").style.display = "inline";
  } else {
    document.getElementById("nav-login").style.display = "inline";
    document.getElementById("nav-logout").style.display = "none";
    document.getElementById("nav-add").style.display = "none";
  }
});

// ─── Home Screen ─────────────────────────────────────────────────────────────
async function renderHomeScreen() {
  const container = document.getElementById("recipe-cards");
  container.innerHTML = "<p style='color:#9E6B70; text-align:center; padding:40px;'>Loading recipes...</p>";

  const recipes = await getAllRecipes();
  container.innerHTML = "";

  recipes.forEach((recipe) => {
    const card = document.createElement("div");
    card.className = "recipe-card";

    const imgHtml = recipe.image
      ? `<img src="${recipe.image}" alt="${recipe.name}" />`
      : `<div class="card-img-placeholder">${recipe.emoji}</div>`;

    card.innerHTML = `
      <div class="card-img-wrap">${imgHtml}</div>
      <div class="card-info">
        <div class="card-text">
          <div class="card-name">${recipe.name}</div>
          <div class="card-meta-small">
            <span class="card-source">${recipe.difficulty}</span>
            <span class="card-time">⏱ ${recipe.time}</span>
          </div>
        </div>
        <button class="card-play" aria-label="Start recipe">▶</button>
      </div>
    `;

    card.querySelector(".card-play").addEventListener("click", () => startRecipe(recipe.id));
    card.querySelector(".card-img-wrap").addEventListener("click", () => startRecipe(recipe.id));
    card.querySelector(".card-name").addEventListener("click", () => startRecipe(recipe.id));
    container.appendChild(card);
  });
}

// ─── Navigation ──────────────────────────────────────────────────────────────
async function startRecipe(recipeId) {
  currentRecipe = await getRecipeById(recipeId);
  if (currentRecipe.steps && !Array.isArray(currentRecipe.steps)) {
    currentRecipe.steps = Object.values(currentRecipe.steps);
  }
  currentStepIndex = 0;
  clearTimerState();
  showScreen("recipe-screen");
  renderStep();
}

function goHome() {
  clearTimerState();
  currentRecipe = null;
  showScreen("home-screen");
  renderHomeScreen();
}

function nextStep() {
  if (currentStepIndex < currentRecipe.steps.length - 1) {
    currentStepIndex++;
    clearTimerState();
    renderStep();
    scrollToTop();
  }
}

function prevStep() {
  if (currentStepIndex > 0) {
    currentStepIndex--;
    clearTimerState();
    renderStep();
    scrollToTop();
  }
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ─── Step Renderer ───────────────────────────────────────────────────────────
function renderStep() {
  const step = currentRecipe.steps[currentStepIndex];
  const totalSteps = currentRecipe.steps.length;
  const isLast = currentStepIndex === totalSteps - 1;
  const isFirst = currentStepIndex === 0;

  document.getElementById("nav-title").textContent = currentRecipe.name;
  document.getElementById("step-counter").textContent = `${currentStepIndex + 1} / ${totalSteps}`;

  const pct = ((currentStepIndex + 1) / totalSteps) * 100;
  document.getElementById("progress-bar").style.width = pct + "%";

  document.getElementById("step-label").textContent = step.label;
  document.getElementById("step-title").textContent = step.title;
  document.getElementById("step-instruction").textContent = step.instruction;

  const panel = document.getElementById("ingredients-panel");
  const list = document.getElementById("ingredient-list");
  if (step.ingredients && step.ingredients.length > 0) {
    list.innerHTML = step.ingredients
      .map((ing) => `<li><span class="ing-amount">${ing.amount}</span><span class="ing-name">${ing.name}</span></li>`)
      .join("");
    panel.style.display = "flex";
  } else {
    panel.style.display = "none";
  }

  const tipBox = document.getElementById("tip-box");
  const tipText = document.getElementById("tip-text");
  if (step.tip) {
    tipText.textContent = step.tip;
    tipBox.style.display = "flex";
  } else {
    tipBox.style.display = "none";
  }

  const tsBox = document.getElementById("troubleshoot-box");
  const tsText = document.getElementById("troubleshoot-text");
  if (step.troubleshoot) {
    tsText.textContent = step.troubleshoot;
    tsBox.style.display = "flex";
  } else {
    tsBox.style.display = "none";
  }

  const timerBox = document.getElementById("timer-box");
  if (step.timer) {
    timerSecondsLeft = step.timer;
    timerBox.style.display = "flex";
    updateTimerDisplay();
    document.getElementById("timer-btn").textContent = "Start Timer";
  } else {
    timerBox.style.display = "none";
  }

  document.getElementById("btn-prev").style.display = isFirst ? "none" : "inline-flex";
  document.getElementById("btn-next").style.display = isLast ? "none" : "inline-flex";
  document.getElementById("btn-finish").style.display = isLast ? "inline-flex" : "none";
}

// ─── Timer ───────────────────────────────────────────────────────────────────
function toggleTimer() {
  if (timerRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  if (timerSecondsLeft <= 0) return;
  timerRunning = true;
  document.getElementById("timer-btn").textContent = "Pause";
  timerInterval = setInterval(() => {
    timerSecondsLeft--;
    updateTimerDisplay();
    if (timerSecondsLeft <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      document.getElementById("timer-btn").textContent = "Done!";
      document.getElementById("timer-display").classList.add("timer-done");
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  document.getElementById("timer-btn").textContent = "Resume";
}

function resetTimer() {
  clearTimerState();
  const step = currentRecipe.steps[currentStepIndex];
  if (step.timer) {
    timerSecondsLeft = step.timer;
    updateTimerDisplay();
    document.getElementById("timer-btn").textContent = "Start Timer";
    document.getElementById("timer-display").classList.remove("timer-done");
  }
}

function clearTimerState() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning = false;
  timerSecondsLeft = 0;
}

function updateTimerDisplay() {
  const mins = Math.floor(timerSecondsLeft / 60);
  const secs = timerSecondsLeft % 60;
  document.getElementById("timer-display").textContent =
    `${mins}:${secs.toString().padStart(2, "0")}`;
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function showAuthScreen() {
  showScreen("auth-screen");
}

function toggleAuthMode() {
  authMode = authMode === "login" ? "signup" : "login";
  document.getElementById("auth-title").textContent = authMode === "login" ? "Welcome back" : "Create an account";
  document.getElementById("auth-sub").textContent = authMode === "login"
    ? "Log in to save and share your recipes"
    : "Sign up to start adding your own recipes";
  document.getElementById("auth-error").textContent = "";
  document.querySelector(".btn-auth").textContent = authMode === "login" ? "Log In" : "Sign Up";
  document.querySelector(".auth-switch").innerHTML = authMode === "login"
    ? `Don't have an account? <a href="#" onclick="toggleAuthMode(); return false;">Sign up</a>`
    : `Already have an account? <a href="#" onclick="toggleAuthMode(); return false;">Log in</a>`;
}

async function handleAuth() {
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;
  const errorEl = document.getElementById("auth-error");
  errorEl.textContent = "";

  if (!email || !password) {
    errorEl.textContent = "Please fill in both fields.";
    return;
  }

  try {
    if (authMode === "login") {
      await logIn(email, password);
    } else {
      await signUp(email, password);
    }
    goHome();
  } catch (err) {
    if (err.code === "auth/invalid-credential") errorEl.textContent = "Wrong email or password.";
    else if (err.code === "auth/email-already-in-use") errorEl.textContent = "An account with this email already exists.";
    else if (err.code === "auth/weak-password") errorEl.textContent = "Password must be at least 6 characters.";
    else if (err.code === "auth/invalid-email") errorEl.textContent = "Please enter a valid email address.";
    else errorEl.textContent = "Something went wrong. Try again.";
  }
}

async function handleLogout() {
  await logOut();
  goHome();
}

// ─── Add Recipe Screen ────────────────────────────────────────────────────────
function showAddRecipe() {
  if (!currentUser) {
    showAuthScreen();
    return;
  }
  stepCount = 0;
  document.getElementById("steps-container").innerHTML = "";
  document.getElementById("r-name").value = "";document.getElementById("r-image").value = "";
  document.getElementById("image-preview").style.display = "none";
  document.getElementById("upload-label-text").textContent = "📷 Upload a photo of your recipe";
  document.getElementById("r-time").value = "";
  document.getElementById("r-description").value = "";
  document.getElementById("save-status").textContent = "";
  showScreen("add-recipe-screen");
  addStep();
}

function addStep() {
  stepCount++;
  const container = document.getElementById("steps-container");
  const stepEl = document.createElement("div");
  stepEl.className = "step-form-block";
  stepEl.id = `step-block-${stepCount}`;
  stepEl.innerHTML = `
    <div class="step-form-header">
      <span class="step-form-num">Step ${stepCount}</span>
      <button class="btn-remove-step" onclick="removeStep(${stepCount})">Remove</button>
    </div>
    <input type="text" placeholder="Step title (e.g. Brown the Butter)" class="form-input" id="s${stepCount}-title" />
    <input type="text" placeholder="Label (e.g. Step 1, Prep, Final)" class="form-input" id="s${stepCount}-label" />
    <textarea placeholder="Step instruction — what should the user do?" class="form-input form-textarea" id="s${stepCount}-instruction"></textarea>
    <textarea placeholder="Ingredients for this step (one per line, e.g. 115g unsalted butter)" class="form-input form-textarea-sm" id="s${stepCount}-ingredients"></textarea>
    <input type="text" placeholder="Beginner tip (optional)" class="form-input" id="s${stepCount}-tip" />
    <input type="text" placeholder="Troubleshoot tip (optional)" class="form-input" id="s${stepCount}-troubleshoot" />
    <input type="number" placeholder="Timer in minutes (optional, e.g. 5)" class="form-input" id="s${stepCount}-timer" />
  `;
  container.appendChild(stepEl);
}

function removeStep(num) {
  const el = document.getElementById(`step-block-${num}`);
  if (el) el.remove();
}

async function submitRecipe() {
  if (!currentUser) {
    showAuthScreen();
    return;
  }

  const name = document.getElementById("r-name").value.trim();
  const imageFile = document.getElementById("r-image").files[0];
  const time = document.getElementById("r-time").value.trim();
  const difficulty = document.getElementById("r-difficulty").value;
  const description = document.getElementById("r-description").value.trim();
  const statusEl = document.getElementById("save-status");

  if (!name || !time) {
    statusEl.textContent = "Please fill in the recipe name and time.";
    statusEl.style.color = "#c0392b";
    return;
  }

  const steps = [];
  const stepBlocks = document.querySelectorAll(".step-form-block");

  stepBlocks.forEach((block) => {
    const num = block.id.replace("step-block-", "");
    const title = document.getElementById(`s${num}-title`).value.trim();
    const label = document.getElementById(`s${num}-label`).value.trim();
    const instruction = document.getElementById(`s${num}-instruction`).value.trim();
    const ingredientRaw = document.getElementById(`s${num}-ingredients`).value.trim();
    const tip = document.getElementById(`s${num}-tip`).value.trim();
    const troubleshoot = document.getElementById(`s${num}-troubleshoot`).value.trim();
    const timerMins = document.getElementById(`s${num}-timer`).value;

    const ingredients = ingredientRaw
      ? ingredientRaw.split("\n").map((line) => {
          const parts = line.trim().split(" ");
          return { amount: parts[0], name: parts.slice(1).join(" ") };
        }).filter(i => i.name)
      : [];

    steps.push({
      title: title || `Step ${num}`,
      label: label || `Step ${num}`,
      instruction,
      ingredients,
      tip: tip || null,
      troubleshoot: troubleshoot || null,
      timer: timerMins ? parseInt(timerMins) * 60 : null,
    });
  });

  if (steps.length === 0) {
    statusEl.textContent = "Please add at least one step.";
    statusEl.style.color = "#c0392b";
    return;
  }

  try {
    statusEl.textContent = "Saving...";
    statusEl.style.color = "var(--pink-dark)";let imageUrl = null;
  if (imageFile) {
    statusEl.textContent = "Uploading image...";
    imageUrl = await uploadImageToCloudinary(imageFile);
  }
  await saveRecipe({ name, emoji: "🍽️", image: imageUrl, time, difficulty, description, steps }, currentUser.uid);
    statusEl.textContent = "✅ Recipe saved!";
    statusEl.style.color = "var(--sage)";
    setTimeout(() => goHome(), 1500);
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Something went wrong. Try again.";
    statusEl.style.color = "#c0392b";
  }
}

// ─── Chat ────────────────────────────────────────────────────────────────────
function toggleChat() {
  const box = document.getElementById("chat-box");
  const btn = document.getElementById("chat-toggle");
  const isHidden = box.style.display === "none";
  box.style.display = isHidden ? "flex" : "none";
  box.style.flexDirection = "column";
  btn.textContent = isHidden ? "💬 Close Assistant" : "💬 Ask Baking Assistant";
}

async function sendMessage() {
  const input = document.getElementById("chat-input");
  const messages = document.getElementById("chat-messages");
  const message = input.value.trim();
  if (!message) return;

  const step = currentRecipe.steps[currentStepIndex];

  // Show user bubble
  messages.innerHTML += `<div class="chat-bubble user">${message}</div>`;
  input.value = "";

  // Show thinking bubble
  const thinkingId = "thinking-" + Date.now();
  messages.innerHTML += `<div class="chat-bubble thinking" id="${thinkingId}">Thinking...</div>`;
  messages.scrollTop = messages.scrollHeight;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        recipeName: currentRecipe.name,
        stepTitle: step.title,
        stepInstruction: step.instruction
      })
    });

    const data = await response.json();
    document.getElementById(thinkingId).remove();
    if (data.reply) {
      messages.innerHTML += `<div class="chat-bubble assistant">${data.reply}</div>`;
    } else {
      messages.innerHTML += `<div class="chat-bubble assistant">I'm getting too many requests right now — try again in a moment! 🍞</div>`;
    }
    messages.scrollTop = messages.scrollHeight;

  } catch (err) {
    document.getElementById(thinkingId).remove();
    messages.innerHTML += `<div class="chat-bubble assistant">Sorry, something went wrong. Try again!</div>`;
  }
}

// Allow Enter key to send
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("chat-input");
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendMessage();
    });
  }
});

// ─── Image Upload ─────────────────────────────────────────────────────────────
function previewImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const preview = document.getElementById("image-preview");
  preview.src = URL.createObjectURL(file);
  preview.style.display = "block";
  document.getElementById("upload-label-text").textContent = "📷 " + file.name;
}

async function uploadImageToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "bake-w-me");

  const response = await fetch("https://api.cloudinary.com/v1_1/qtuckntq/image/upload", {
    method: "POST",
    body: formData
  });

  const data = await response.json();
  return data.secure_url;
}

// ─── Init ─────────────────────────────────────────────────────────────────────
renderHomeScreen();

// ─── Expose to HTML ───────────────────────────────────────────────────────────
window.nextStep = nextStep;
window.prevStep = prevStep;
window.goHome = goHome;
window.toggleTimer = toggleTimer;
window.resetTimer = resetTimer;
window.showAuthScreen = showAuthScreen;
window.toggleAuthMode = toggleAuthMode;
window.handleAuth = handleAuth;
window.handleLogout = handleLogout;
window.showAddRecipe = showAddRecipe;
window.addStep = addStep;
window.removeStep = removeStep;
window.submitRecipe = submitRecipe;
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;
window.previewImage = previewImage;