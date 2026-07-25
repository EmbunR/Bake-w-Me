import { getAllRecipes, getRecipeById } from "./firebase.js";

// ─── State ───────────────────────────────────────────────────────────────────
let currentRecipe = null;
let currentStepIndex = 0;

// Timer state
let timerInterval = null;
let timerSecondsLeft = 0;
let timerRunning = false;

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
  // Firestore sometimes returns arrays as objects — this converts it back
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

  // Nav
  document.getElementById("nav-title").textContent = currentRecipe.name;
  document.getElementById("step-counter").textContent = `${currentStepIndex + 1} / ${totalSteps}`;

  // Progress bar
  const pct = ((currentStepIndex + 1) / totalSteps) * 100;
  document.getElementById("progress-bar").style.width = pct + "%";

  // Step content
  document.getElementById("step-label").textContent = step.label;
  document.getElementById("step-title").textContent = step.title;
  document.getElementById("step-instruction").textContent = step.instruction;

  // Ingredients
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

  // Tip
  const tipBox = document.getElementById("tip-box");
  const tipText = document.getElementById("tip-text");
  if (step.tip) {
    tipText.textContent = step.tip;
    tipBox.style.display = "flex";
  } else {
    tipBox.style.display = "none";
  }

  // Troubleshoot
  const tsBox = document.getElementById("troubleshoot-box");
  const tsText = document.getElementById("troubleshoot-text");
  if (step.troubleshoot) {
    tsText.textContent = step.troubleshoot;
    tsBox.style.display = "flex";
  } else {
    tsBox.style.display = "none";
  }

  // Timer
  const timerBox = document.getElementById("timer-box");
  if (step.timer) {
    timerSecondsLeft = step.timer;
    timerBox.style.display = "flex";
    updateTimerDisplay();
    document.getElementById("timer-btn").textContent = "Start Timer";
  } else {
    timerBox.style.display = "none";
  }

  // Footer buttons
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

// ─── Init ─────────────────────────────────────────────────────────────────────
renderHomeScreen();

// Expose functions to HTML onclick handlers
window.nextStep = nextStep;
window.prevStep = prevStep;
window.goHome = goHome;
window.toggleTimer = toggleTimer;
window.resetTimer = resetTimer;