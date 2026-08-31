const PROGRAM = {
  Monday: [
    ["Barbell Bench Press", 3, 6, 8, 2.5, "Push", "Chest"],
    ["Incline Dumbbell Press", 3, 8, 12, 2.0, "Push", "Chest"],
    ["Cable Lateral Raise", 3, 12, 20, 1.0, "Push", "Shoulders"],
    ["Cable Triceps Pushdown", 3, 10, 15, 1.0, "Push", "Triceps"],
    ["Overhead Triceps Extension", 2, 10, 15, 1.0, "Push", "Triceps"],
  ],
  Tuesday: [
    ["Pull-ups / Assisted Pull-ups", 3, 6, 10, 2.5, "Pull", "Back"],
    ["Chest-supported Row", 3, 8, 12, 2.5, "Pull", "Back"],
    ["Lat Pulldown", 2, 10, 15, 2.0, "Pull", "Back"],
    ["Cable Rear-delt Fly", 3, 12, 20, 1.0, "Pull", "Shoulders"],
    ["Incline Dumbbell Curl", 3, 8, 12, 1.0, "Pull", "Biceps"],
    ["Hammer Curl", 2, 10, 15, 1.0, "Pull", "Biceps"],
  ],
  Wednesday: [
    ["HIIT Bike / Air Bike", 6, 30, 30, 0, "Cardio", "Cardio"],
    ["Cable Crunch", 3, 10, 15, 1.0, "Core", "Abs"],
    ["Hanging Knee Raise", 3, 8, 15, 1.0, "Core", "Abs"],
    ["Pallof Press", 2, 10, 15, 1.0, "Core", "Core"],
  ],
  Thursday: [
    ["Back Squat / Hack Squat", 3, 6, 10, 2.5, "Legs", "Quads"],
    ["Romanian Deadlift", 3, 8, 10, 2.5, "Legs", "Hamstrings"],
    ["Leg Press", 3, 10, 15, 5.0, "Legs", "Quads"],
    ["Seated Leg Curl", 3, 10, 15, 2.0, "Legs", "Hamstrings"],
    ["Bulgarian Split Squat", 2, 8, 12, 2.0, "Legs", "Glutes"],
    ["Standing Calf Raise", 4, 8, 12, 2.5, "Legs", "Calves"],
    ["Seated Calf Raise", 3, 12, 20, 2.0, "Legs", "Calves"],
  ],
  Friday: [
    ["Incline Bench Press", 2, 8, 10, 2.0, "Full", "Chest"],
    ["Chest-supported Row", 2, 8, 12, 2.5, "Full", "Back"],
    ["Cable Lateral Raise", 2, 12, 20, 1.0, "Full", "Shoulders"],
    ["Leg Extension", 2, 10, 15, 2.0, "Full", "Quads"],
    ["Leg Curl", 2, 10, 15, 2.0, "Full", "Hamstrings"],
    ["Calf Raise", 3, 10, 15, 2.0, "Full", "Calves"],
    ["Optional Curl", 2, 10, 15, 1.0, "Full", "Biceps"],
    ["Optional Triceps Extension", 2, 10, 15, 1.0, "Full", "Triceps"],
  ],
};

const DAYS = Object.keys(PROGRAM);
const STORAGE_KEY = "wca:v1";

const state = {
  selectedDay: getCurrentDay(),
  phase: "idle",
  currentExerciseIndex: 0,
  currentSetNumber: 1,
  weight: 60,
  reps: 8,
  rir: 2,
  restSeconds: 90,
  restActive: false,
  restTimerId: null,
  data: loadData(),
};

const els = {
  daySelector: document.getElementById("daySelector"),
  startBtn: document.getElementById("startBtn"),
  statsGrid: document.getElementById("statsGrid"),
  sessionCard: document.getElementById("sessionCard"),
  weeklySummary: document.getElementById("weeklySummary"),
  prList: document.getElementById("prList"),
  recentLog: document.getElementById("recentLog"),
  resetBtn: document.getElementById("resetBtn"),
};

function getCurrentDay() {
  return DAYS.includes(new Date().toLocaleDateString("en-US", { weekday: "long" }))
    ? new Date().toLocaleDateString("en-US", { weekday: "long" })
    : "Monday";
}

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return { logs: [] };
  }

  try {
    return JSON.parse(saved);
  } catch {
    return { logs: [] };
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentExercise() {
  return PROGRAM[state.selectedDay][state.currentExerciseIndex];
}

function getCurrentSetTarget() {
  const exercise = getCurrentExercise();
  if (!exercise) return null;
  return exercise[2];
}

function asNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function buildRecommendation(exerciseName) {
  const prev = state.data.logs.filter((entry) => entry.exercise === exerciseName && entry.day === state.selectedDay);
  if (!prev.length) {
    return { label: "New exercise", value: 0 };
  }

  const maxWeight = Math.max(...prev.map((entry) => Number(entry.weight || 0)));
  const repsBelow = prev.filter((entry) => Number(entry.reps) < Number(exerciseName.includes("Bench") ? 6 : 8)).length;
  const topRange = prev.every((entry) => Number(entry.reps) >= 8);

  if (topRange) return { label: "Ready to increase", value: Number((maxWeight * 1.025).toFixed(2)) };
  if (repsBelow >= 2) return { label: "Reduce load", value: Number((maxWeight * 0.975).toFixed(2)) };
  return { label: "Hold", value: Number(maxWeight.toFixed(2)) };
}

function renderDaySelector() {
  els.daySelector.innerHTML = DAYS.map((day) => {
    const active = day === state.selectedDay ? "active" : "";
    return `<button class="day-button ${active}" data-day="${day}">${day.slice(0, 3)}</button>`;
  }).join("");

  els.daySelector.querySelectorAll(".day-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedDay = button.dataset.day;
      state.phase = "idle";
      state.currentExerciseIndex = 0;
      state.currentSetNumber = 1;
      render();
    });
  });
}

function getWeeklySummary() {
  const recent = state.data.logs.filter((entry) => {
    const logDate = new Date(entry.date);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 6);
    return logDate >= cutoff;
  });

  const completedSets = recent.length;
  const totalVolume = recent.reduce((sum, entry) => sum + Number(entry.weight || 0) * Number(entry.reps || 0), 0);
  const avgReps = recent.length ? (recent.reduce((sum, entry) => sum + Number(entry.reps || 0), 0) / recent.length).toFixed(1) : "0.0";
  const daysLogged = new Set(recent.map((entry) => entry.date)).size;

  return {
    completedSets,
    totalVolume: totalVolume.toFixed(1),
    avgReps,
    daysLogged,
  };
}

function getPRs() {
  const map = new Map();
  state.data.logs.forEach((entry) => {
    const key = entry.exercise;
    if (!map.has(key)) {
      map.set(key, { bestWeight: 0, bestReps: 0, prDate: "-", est1RM: 0 });
    }

    const current = map.get(key);
    const weight = Number(entry.weight || 0);
    const reps = Number(entry.reps || 0);
    const est1RM = Number((weight * (1 + reps / 30)).toFixed(2));

    if (weight > current.bestWeight) {
      current.bestWeight = weight;
      current.prDate = entry.date;
    }

    if (reps > current.bestReps) {
      current.bestReps = reps;
      current.prDate = entry.date;
    }

    if (est1RM > current.est1RM) {
      current.est1RM = est1RM;
      current.prDate = entry.date;
    }
  });

  return [...map.entries()].map(([exercise, value]) => ({ exercise, ...value }));
}

function renderStats() {
  const weekly = getWeeklySummary();
  const summaryCards = [
    { label: "Sets", value: weekly.completedSets },
    { label: "Volume", value: `${weekly.totalVolume} kg` },
    { label: "Avg reps", value: weekly.avgReps },
    { label: "Days", value: weekly.daysLogged },
  ];

  els.statsGrid.innerHTML = summaryCards.map((card) => `
    <div class="stat-card">
      <span class="label">${card.label}</span>
      <span class="value">${card.value}</span>
    </div>
  `).join("");
}

function renderSession() {
  if (state.phase === "idle") {
    const exercise = PROGRAM[state.selectedDay][0];
    els.sessionCard.innerHTML = `
      <div class="phase-tag">Ready</div>
      <h2 class="exercise-title">${exercise[0]}</h2>
      <div class="exercise-meta">
        ${state.selectedDay} · ${exercise[1]} sets · ${exercise[2]}-${exercise[3]} reps · ${exercise[5]} · ${exercise[6]}
      </div>
      <div class="recommendation-box">
        <strong>Next recommendation</strong>
        <div class="recommendation-value">${buildRecommendation(exercise[0]).value || 0} kg</div>
        <div>${buildRecommendation(exercise[0]).label}</div>
      </div>
      <div class="note-box">
        <strong>Warm-up</strong>
        Light cardio + mobility and a few easy sets before the first work set.
      </div>
    `;
    return;
  }

  if (state.phase === "warmup") {
    const exercise = getCurrentExercise();
    els.sessionCard.innerHTML = `
      <div class="phase-tag">Warm-up</div>
      <h2 class="exercise-title">${exercise[0]}</h2>
      <div class="exercise-meta">
        ${state.selectedDay} · ${exercise[1]} sets · ${exercise[2]}-${exercise[3]} reps
      </div>
      <div class="note-box">
        <strong>Suggested warm-up</strong>
        3-5 minutes of easy cardio, joint prep, then a light ramp-up set.
      </div>
      <div class="log-row">
        <button class="primary-btn large" id="warmupDoneBtn">Warm-up complete</button>
        <button class="action-btn" id="warmupSkipBtn">Skip warm-up</button>
      </div>
    `;

    document.getElementById("warmupDoneBtn").addEventListener("click", () => {
      state.phase = "exercise";
      render();
    });

    document.getElementById("warmupSkipBtn").addEventListener("click", () => {
      state.phase = "exercise";
      render();
    });
    return;
  }

  if (state.phase === "cooldown") {
    els.sessionCard.innerHTML = `
      <div class="phase-tag">Cool-down</div>
      <h2 class="exercise-title">Session complete</h2>
      <div class="exercise-meta">
        Recovery walk, breathing, and light mobility after training.
      </div>
      <div class="note-box">
        <strong>Cool-down</strong>
        3-8 minutes of easy movement, relax the muscles, and note if you feel stiffness or pain.
      </div>
      <div class="log-row">
        <button class="primary-btn large" id="cooldownDoneBtn">Finish workout</button>
        <button class="action-btn" id="cooldownSkipBtn">Skip cool-down</button>
      </div>
    `;

    document.getElementById("cooldownDoneBtn").addEventListener("click", () => {
      state.phase = "done";
      render();
    });

    document.getElementById("cooldownSkipBtn").addEventListener("click", () => {
      state.phase = "done";
      render();
    });
    return;
  }

  if (state.phase === "done") {
    const summary = getWeeklySummary();
    els.sessionCard.innerHTML = `
      <div class="phase-tag">Workout summary</div>
      <h2 class="exercise-title">Session finished</h2>
      <div class="exercise-meta">
        Logged ${summary.completedSets} sets this week in ${summary.daysLogged} days.
      </div>
      <div class="recommendation-box">
        <strong>Volume</strong>
        <div class="recommendation-value">${summary.totalVolume} kg</div>
      </div>
      <div class="note-box">
        <strong>Progress</strong>
        Average reps: ${summary.avgReps} · Focus on consistency and recovery.
      </div>
    `;
    return;
  }

  const exercise = getCurrentExercise();
  const rec = buildRecommendation(exercise[0]);
  const completedToday = state.data.logs.filter((entry) => entry.day === state.selectedDay && entry.date === getTodayKey());

  els.sessionCard.innerHTML = `
    <div class="phase-tag">Exercise ${state.currentExerciseIndex + 1}/${PROGRAM[state.selectedDay].length}</div>
    <h2 class="exercise-title">${exercise[0]}</h2>
    <div class="exercise-meta">
      ${exercise[1]} sets · ${exercise[2]}-${exercise[3]} reps · ${exercise[5]} · ${exercise[6]} · Target RIR 2
    </div>

    <div class="recommendation-box">
      <strong>Recommended weight</strong>
      <div class="recommendation-value">${rec.value || 0} kg</div>
      <div>${rec.label}</div>
    </div>

    <div class="timer-box">
      <strong>Rest timer</strong>
      <div>${state.restActive ? formatSeconds(state.restSeconds) : "Ready to begin"}</div>
    </div>

    <div class="form-grid">
      <div class="field">
        <label>Weight</label>
        <div class="stepper">
          <button class="small-btn" data-adjust="weight:-2.5">−</button>
          <div class="value-box">${state.weight.toFixed(1)}</div>
          <button class="small-btn" data-adjust="weight:2.5">+</button>
        </div>
      </div>

      <div class="field">
        <label>Reps</label>
        <div class="stepper">
          <button class="small-btn" data-adjust="reps:-1">−</button>
          <div class="value-box">${state.reps}</div>
          <button class="small-btn" data-adjust="reps:1">+</button>
        </div>
      </div>

      <div class="field">
        <label>RIR</label>
        <div class="rir-options">
          ${[0, 1, 2, 3, 4].map((option) => {
            const selected = state.rir === option ? "selected" : "";
            return `<button class="rir-option ${selected}" data-rir="${option}">${option === 4 ? "4+" : option}</button>`;
          }).join("")}
        </div>
      </div>
    </div>

    <div class="log-row">
      <button class="action-btn" id="restBtn">${state.restActive ? "Stop rest" : "Start rest"}</button>
      <button class="action-btn" id="skipBtn">Skip set</button>
      <button class="primary-btn large" id="logBtn">Log set</button>
    </div>

    <div class="note-box">
      <strong>Recent work</strong>
      ${completedToday.length ? completedToday.slice(-3).map((entry) => `${entry.weight} × ${entry.reps} @ ${entry.rir} RIR`).join(" · ") : "No sets logged yet for this day."}
    </div>
  `;

  document.getElementById("logBtn").addEventListener("click", () => {
    const entry = {
      date: getTodayKey(),
      day: state.selectedDay,
      exercise: exercise[0],
      setNumber: state.currentSetNumber,
      weight: state.weight,
      reps: state.reps,
      rir: state.rir,
    };

    state.data.logs.push(entry);
    saveData();
    state.currentSetNumber += 1;

    if (state.currentSetNumber > exercise[1]) {
      state.currentExerciseIndex += 1;
      state.currentSetNumber = 1;

      if (state.currentExerciseIndex >= PROGRAM[state.selectedDay].length) {
        state.phase = "cooldown";
      }
    }

    state.weight = rec.value || 60;
    state.reps = exercise[2];
    state.rir = 2;
    render();
  });

  document.getElementById("skipBtn").addEventListener("click", () => {
    state.currentSetNumber += 1;
    if (state.currentSetNumber > getCurrentExercise()[1]) {
      state.currentExerciseIndex += 1;
      state.currentSetNumber = 1;
      if (state.currentExerciseIndex >= PROGRAM[state.selectedDay].length) {
        state.phase = "cooldown";
      }
    }
    render();
  });

  document.getElementById("restBtn").addEventListener("click", () => {
    if (state.restActive) {
      clearInterval(state.restTimerId);
      state.restActive = false;
      state.restTimerId = null;
    } else {
      state.restActive = true;
      state.restSeconds = 90;
      state.restTimerId = setInterval(() => {
        if (state.restSeconds <= 0) {
          clearInterval(state.restTimerId);
          state.restActive = false;
          state.restTimerId = null;
          render();
          return;
        }
        state.restSeconds -= 1;
        render();
      }, 1000);
    }
    render();
  });

  document.querySelectorAll("[data-adjust]").forEach((button) => {
    button.addEventListener("click", () => {
      const [field, deltaText] = button.dataset.adjust.split(":");
      const delta = Number(deltaText);
      if (field === "weight") {
        state.weight = Number((state.weight + delta).toFixed(1));
      }
      if (field === "reps") {
        state.reps = Math.max(1, state.reps + delta);
      }
      render();
    });
  });

  document.querySelectorAll("[data-rir]").forEach((button) => {
    button.addEventListener("click", () => {
      state.rir = Number(button.dataset.rir);
      render();
    });
  });
}

function formatSeconds(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function renderWeeklySummary() {
  const weekly = getWeeklySummary();
  els.weeklySummary.innerHTML = `
    <div>Completed sets: <strong>${weekly.completedSets}</strong></div>
    <div>Volume: <strong>${weekly.totalVolume} kg</strong></div>
    <div>Avg reps: <strong>${weekly.avgReps}</strong></div>
    <div>Days logged: <strong>${weekly.daysLogged}</strong></div>
  `;
}

function renderPRs() {
  const prs = getPRs();
  if (!prs.length) {
    els.prList.innerHTML = '<li class="empty-state">No PRs yet.</li>';
    return;
  }

  els.prList.innerHTML = prs.slice(0, 5).map((pr) => `
    <li>
      <strong>${pr.exercise}</strong><br />
      Best: ${pr.bestWeight} kg · ${pr.bestReps} reps
    </li>
  `).join("");
}

function renderRecentLog() {
  const recent = [...state.data.logs].reverse().slice(0, 5);
  if (!recent.length) {
    els.recentLog.innerHTML = '<li class="empty-state">No logs yet.</li>';
    return;
  }

  els.recentLog.innerHTML = recent.map((entry) => `
    <li>${entry.exercise}: ${entry.weight} × ${entry.reps} @ ${entry.rir} RIR</li>
  `).join("");
}

function render() {
  renderDaySelector();
  renderStats();
  renderSession();
  renderWeeklySummary();
  renderPRs();
  renderRecentLog();
}

els.startBtn.addEventListener("click", () => {
  state.phase = "warmup";
  state.currentExerciseIndex = 0;
  state.currentSetNumber = 1;
  render();
});

els.resetBtn.addEventListener("click", () => {
  state.data = { logs: [] };
  saveData();
  state.phase = "idle";
  state.currentExerciseIndex = 0;
  state.currentSetNumber = 1;
  render();
});

render();
