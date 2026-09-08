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
const ROUTINES = {
  Monday: { name: "Push Strength", focus: "Chest, shoulders and triceps" },
  Tuesday: { name: "Pull Strength", focus: "Back, biceps and rear delts" },
  Wednesday: { name: "Core & Conditioning", focus: "Cardio, abs and core" },
  Thursday: { name: "Leg Strength", focus: "Quads, hamstrings, glutes and calves" },
  Friday: { name: "Full Body", focus: "Balanced full-body training" },
};
const STORAGE_KEY = "wca:v1";
const USER_NAME_KEY = "wca:user-name";
const ACTIVE_FILE_NAME = "workout-companion-active.json";
const RECOVERY_FILE_PREFIX = "workout-companion-backup-";
const DAILY_RECOVERY_KEY = "wca:daily-recovery-date";
const ACTIVE_FILE_KEY = "wca:active-file";
const LAST_SAVED_KEY = "wca:last-saved";
const LAST_BACKUP_KEY = "wca:last-backup";

const state = {
  selectedDay: getCurrentDay(),
  activePage: "routines",
  phase: "idle",
  currentExerciseIndex: 0,
  currentSetNumber: 1,
  weight: 60,
  reps: 8,
  rir: 2,
  restSeconds: 90,
  restActive: false,
  restStartedAt: null,
  restExerciseKey: null,
  restDuration: 90,
  restTimerId: null,
  completedExercises: {},
  pendingSetValues: {},
  historySessionLimits: {},
  historySelectedDates: {},
  data: loadData(),
  fileHandle: null,
};

const els = {
  menuToggle: document.getElementById("menuToggle"),
  menuClose: document.getElementById("menuClose"),
  topbarActions: document.getElementById("topbarActions"),
  routinesHome: document.getElementById("routinesHome"),
  routineDetail: document.getElementById("routineDetail"),
  routineDetailTitle: document.getElementById("routineDetailTitle"),
  routineDetailFocus: document.getElementById("routineDetailFocus"),
  routineExerciseList: document.getElementById("routineExerciseList"),
  backToRoutinesBtn: document.getElementById("backToRoutinesBtn"),
  userNameInput: document.getElementById("userNameInput"),
  userView: document.getElementById("userView"),
  userProfileDisplay: document.getElementById("userProfileDisplay"),
  daySelector: document.getElementById("daySelector"),
  selectedRoutineLabel: document.getElementById("selectedRoutineLabel"),
  endRoutineBtn: document.getElementById("endRoutineBtn"),
  startBtn: document.getElementById("startBtn"),
  statsGrid: document.getElementById("statsGrid"),
  sessionCard: document.getElementById("sessionCard"),
  weeklySummary: document.getElementById("weeklySummary"),
  prList: document.getElementById("prList"),
  recentLog: document.getElementById("recentLog"),
  resetBtn: document.getElementById("resetBtn"),
  backupStatus: document.getElementById("backupStatus"),
  saveNowBtn: document.getElementById("saveNowBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  openFileBtn: document.getElementById("openFileBtn"),
  workoutView: document.getElementById("workoutView"),
  dataView: document.getElementById("dataView"),
  historyView: document.getElementById("historyView"),
  historyContent: document.getElementById("historyContent"),
  tabButtons: document.querySelectorAll(".tab-toggle"),
};

function getCurrentDay() {
  return DAYS.includes(new Date().toLocaleDateString("en-US", { weekday: "long" }))
    ? new Date().toLocaleDateString("en-US", { weekday: "long" })
    : "Monday";
}

function getUserNameValue() {
  const stored = localStorage.getItem(USER_NAME_KEY);
  return (stored && stored.trim()) || "USER";
}

function getPossessiveUserName() {
  const name = (state.data.userName || getUserNameValue() || "USER").trim();
  return `${name || "USER"}'s`;
}

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return { userName: getUserNameValue(), logs: [] };
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      ...parsed,
      userName: (parsed.userName && parsed.userName.trim()) || getUserNameValue(),
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      routineHistory: Array.isArray(parsed.routineHistory) ? parsed.routineHistory : [],
    };
  } catch {
    return { userName: getUserNameValue(), logs: [] };
  }
}

function getStoredUserName() {
  return localStorage.getItem(USER_NAME_KEY) || "USER";
}

function saveUserName() {
  const name = ((els.userNameInput?.value || "").trim() || "USER");
  state.data.userName = name;
  localStorage.setItem(USER_NAME_KEY, name);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  render();
}

function saveData() {
  state.data.userName = ((state.data.userName || getUserNameValue()).trim() || "USER");
  localStorage.setItem(USER_NAME_KEY, state.data.userName || "USER");
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  localStorage.setItem(LAST_SAVED_KEY, new Date().toISOString());
}

function formatDisplayTime(value) {
  if (!value) return "Not yet";
  const date = new Date(value);
  return date.toLocaleString();
}

function updateBackupStatus() {
  const lastSaved = localStorage.getItem(LAST_SAVED_KEY);
  const lastBackup = localStorage.getItem(LAST_BACKUP_KEY);

  els.backupStatus.innerHTML = `
    <div><strong>Last saved:</strong> ${formatDisplayTime(lastSaved)}</div>
    <div><strong>Last backup:</strong> ${formatDisplayTime(lastBackup)}</div>
  `;
}

function formatStamp(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}_${hh}-${mi}-${ss}`;
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportData() {
  const filename = `${RECOVERY_FILE_PREFIX}${formatStamp()}.json`;
  downloadJson(filename, state.data);
}

function persistActiveFile() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  localStorage.setItem(ACTIVE_FILE_KEY, ACTIVE_FILE_NAME);
  localStorage.setItem(LAST_SAVED_KEY, new Date().toISOString());
}

async function saveToFileHandle(handle, payload) {
  if (!handle || !window.showSaveFilePicker && !handle.createWritable) {
    return false;
  }

  try {
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(payload, null, 2));
    await writable.close();
    return true;
  } catch (error) {
    return false;
  }
}

async function saveActiveFile() {
  if (state.fileHandle) {
    const saved = await saveToFileHandle(state.fileHandle, state.data);
    if (saved) {
      persistActiveFile();
    }
    return saved;
  }

  const payload = JSON.stringify(state.data, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = ACTIVE_FILE_NAME;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  persistActiveFile();
  return true;
}

function createDailyRecoveryFile() {
  const todayStamp = formatStamp(new Date()).slice(0, 10);
  const lastCreated = localStorage.getItem(DAILY_RECOVERY_KEY);

  if (lastCreated === todayStamp) {
    return;
  }

  const backupKey = `wca:backup:${todayStamp}`;
  localStorage.setItem(backupKey, JSON.stringify({ createdAt: new Date().toISOString(), ...state.data }));
  localStorage.setItem(DAILY_RECOVERY_KEY, todayStamp);
  localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
}

async function openSelectedFile(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const rawText = String(event.target.result || "").replace(/^\uFEFF/, "").trim();
      const parsed = JSON.parse(rawText || "{}");
      if (!parsed || !Array.isArray(parsed.logs)) {
        alert("This file does not contain valid workout data.");
        return;
      }
      state.data = {
        ...parsed,
        userName: (parsed.userName && String(parsed.userName).trim()) || getUserNameValue(),
        logs: parsed.logs,
        routineHistory: Array.isArray(parsed.routineHistory) ? parsed.routineHistory : [],
      };
      saveData();
      render();
      alert("Workout data loaded successfully.");
    } catch (error) {
      alert(`Could not read this backup file: ${error.message || "invalid JSON"}`);
    }
  };
  reader.onerror = () => {
    alert("Could not read this backup file from the browser.");
  };
  reader.readAsText(file);
}

async function openFilePicker() {
  if (window.showOpenFilePicker) {
    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [{
          description: "Workout JSON files",
          accept: { "application/json": [".json"] },
        }],
      });
      state.fileHandle = handle;
      const file = await handle.getFile();
      await openSelectedFile(file);
      return;
    } catch (error) {
      // fall through to file input if user cancels
    }
  }

  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.onchange = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      await openSelectedFile(file);
    }
  };
  input.click();
}

function importDataFromFile(file) {
  if (!file) return;
  openSelectedFile(file);
}

function autoDailyBackup() {
  const todayStamp = formatStamp(new Date()).slice(0, 10);
  const key = `wca:backup:${todayStamp}`;
  const existing = localStorage.getItem(key);

  if (existing) {
    return;
  }

  const backup = {
    createdAt: new Date().toISOString(),
    ...state.data,
  };

  localStorage.setItem(key, JSON.stringify(backup));
}

function restoreFromDailyBackupIfAvailable() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.logs)) {
        return;
      }
    } catch {
      // Recover from the daily backup when the primary record is corrupted.
    }
  }

  const todayStamp = formatStamp(new Date()).slice(0, 10);
  const backup = localStorage.getItem(`wca:backup:${todayStamp}`);

  if (!backup) {
    return;
  }

  try {
    const parsed = JSON.parse(backup);
    if (parsed && Array.isArray(parsed.logs)) {
      state.data = parsed;
      saveData();
    }
  } catch {
    // Ignore invalid backup and fall back to current state.
  }
}

function getTodayKey() {
  return formatStamp().slice(0, 10);
}

function getCurrentExercise() {
  return PROGRAM[state.selectedDay][state.currentExerciseIndex];
}

function getCurrentSetTarget() {
  const exercise = getCurrentExercise();
  if (!exercise) return null;
  return exercise[2];
}

function getExerciseTargetReps(exercise) {
  const logs = state.data.logs.filter((entry) => entry.exercise === exercise[0] && entry.day === state.selectedDay);
  if (!logs.length) {
    return {
      exact: exercise[3],
      display: `${exercise[2]}-${exercise[3]}`,
      hasHistory: false,
    };
  }

  const recent = logs.slice(-4);
  const avgReps = recent.reduce((sum, entry) => sum + Number(entry.reps || 0), 0) / recent.length;
  const rounded = Math.round(avgReps);
  const upperBound = Number(exercise[3]);
  const lowerBound = Number(exercise[2]);
  const exact = Math.max(lowerBound, Math.min(upperBound, rounded || upperBound));

  return {
    exact,
    display: `${exact}`,
    hasHistory: true,
  };
}

function asNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function getExerciseGuidance(day, exerciseName, throughDate = "") {
  const prev = state.data.logs.filter((entry) => (
    entry.exercise === exerciseName
    && entry.day === day
    && (!throughDate || entry.date <= throughDate)
  ));
  if (!prev.length) {
    return { label: "Start tracking", value: 0, signal: "New" };
  }

  const exerciseDef = PROGRAM[day].find(([name]) => name === exerciseName);
  const minTarget = exerciseDef ? Number(exerciseDef[2]) : 0;
  const maxTarget = exerciseDef ? Number(exerciseDef[3]) : 0;
  const increment = exerciseDef ? Number(exerciseDef[4]) : 0;

  const recent = prev.slice(-6);
  const lastWeight = Number(prev[prev.length - 1].weight || 0);
  const successfulSets = recent.filter((entry) => Number(entry.reps) >= minTarget && Number(entry.rir) <= 2).length;
  const repsAtOrAboveMax = recent.filter((entry) => Number(entry.reps) >= maxTarget && Number(entry.rir) <= 2).length;
  const repsBelowMin = recent.filter((entry) => Number(entry.reps) < minTarget).length;
  const distinctDates = new Set(recent.map((entry) => entry.date)).size;
  const hardSets = recent.filter((entry) => Number(entry.rir) <= 1).length;

  if (recent.length >= 2 && distinctDates >= 2 && repsAtOrAboveMax >= 2 && successfulSets >= recent.length - 1) {
    return {
      label: "Top of range reached across recent work",
      value: Number((lastWeight + increment).toFixed(2)),
      signal: "Increase weight",
    };
  }

  if (recent.length >= 2 && repsBelowMin >= 2 || recent.length >= 3 && hardSets >= recent.length - 1 && repsBelowMin >= 1) {
    return {
      label: "Reduce load or add recovery before progressing",
      value: Number(lastWeight.toFixed(2)),
      signal: "High fatigue",
    };
  }

  return {
    label: "Hold load",
    value: Number(lastWeight.toFixed(2)),
    signal: "Hold load",
  };
}

function buildRecommendation(exerciseName) {
  return getExerciseGuidance(state.selectedDay, exerciseName);
}

function renderDaySelector() {
  els.daySelector.innerHTML = DAYS.map((day) => {
    const routine = ROUTINES[day];
    const active = day === state.selectedDay ? "active" : "";
    return `
      <button class="routine-card ${active}" data-day="${day}">
        <span class="routine-name">${routine.name}</span>
        <span class="routine-focus">${routine.focus}</span>
        <span class="routine-meta">${PROGRAM[day].length} exercises</span>
      </button>
    `;
  }).join("");

  els.daySelector.querySelectorAll(".routine-card").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedDay = button.dataset.day;
      state.activePage = "detail";
      state.phase = "idle";
      state.currentExerciseIndex = 0;
      state.currentSetNumber = 1;
      render();
    });
  });
}

function renderRoutinePage() {
  const routine = ROUTINES[state.selectedDay];
  const isDetail = state.activePage === "detail";

  els.routinesHome.classList.toggle("hidden", isDetail);
  els.routineDetail.classList.toggle("hidden", !isDetail);

  if (!isDetail) {
    return;
  }

  els.routineDetailTitle.textContent = routine.name;
  els.routineDetailFocus.textContent = routine.focus;
  const openExerciseKeys = new Set(
    [...els.routineExerciseList.querySelectorAll("details[open]")]
      .map((details) => details.dataset.exerciseKey)
  );
  const hasExistingExerciseState = els.routineExerciseList.querySelector("details") !== null;
  els.routineExerciseList.innerHTML = PROGRAM[state.selectedDay].map((exercise, index) => {
    const exerciseName = exercise[0];
    const logs = state.data.logs.filter((entry) => (
      entry.exercise === exerciseName
      && entry.day === state.selectedDay
      && entry.date !== getTodayKey()
    ));
    const previous = logs.length ? logs[logs.length - 1] : null;
    const recommendation = buildRecommendation(exerciseName);
    const suggestedWeight = recommendation.value || Number(previous?.weight || 0);
    const suggestedReps = getExerciseTargetReps(exercise).exact;
    const nextSessionNote = suggestedWeight
      ? `<span class="exercise-next-session">Next session: ${suggestedWeight} kg x ${suggestedReps} reps</span>`
      : "";
    const exerciseKey = `${state.selectedDay}:${exerciseName}`;
    const restTimerActive = state.restActive && state.restExerciseKey === exerciseKey;
    const restTimerValue = restTimerActive ? state.restSeconds : getRestDuration(exerciseKey);
    const completedSets = Array.from({ length: exercise[1] }, (_, setIndex) => (
      isSetCompleted(state.selectedDay, exerciseName, setIndex + 1)
    ));
    const completed = completedSets.every(Boolean);
    const rows = Array.from({ length: exercise[1] }, (_, setIndex) => {
      const setKey = `${exerciseKey}:${setIndex + 1}`;
      const todayEntry = state.data.logs.find((entry) => (
        entry.date === getTodayKey()
        && entry.day === state.selectedDay
        && entry.exercise === exerciseName
        && Number(entry.setNumber) === setIndex + 1
      ));
      const weightValue = state.pendingSetValues[setKey]?.weight ?? todayEntry?.weight ?? suggestedWeight;
      const repsValue = state.pendingSetValues[setKey]?.reps ?? todayEntry?.reps ?? suggestedReps;
      const rirValue = state.pendingSetValues[setKey]?.rir ?? todayEntry?.rir ?? 2;

      return `
      <tr>
        <td>${setIndex + 1}</td>
        <td>${previous ? `${previous.weight} kg × ${previous.reps}` : "No previous log"}</td>
        <td>
          <div class="set-editor">
            <button class="set-adjust-btn" type="button" data-adjust-set="${setKey}" data-set-field="weight" data-set-delta="-0.5" aria-label="Decrease weight">-</button>
            <input class="set-input" type="number" min="0" step="0.5" value="${weightValue}" data-set-weight="${setKey}" aria-label="Set ${setIndex + 1} weight" />
            <button class="set-adjust-btn" type="button" data-adjust-set="${setKey}" data-set-field="weight" data-set-delta="0.5" aria-label="Increase weight">+</button>
          </div>
        </td>
        <td>
          <div class="set-editor">
            <button class="set-adjust-btn" type="button" data-adjust-set="${setKey}" data-set-field="reps" data-set-delta="-1" aria-label="Decrease reps">-</button>
            <input class="set-input" type="number" min="1" step="1" value="${repsValue}" data-set-reps="${setKey}" aria-label="Set ${setIndex + 1} reps" />
            <button class="set-adjust-btn" type="button" data-adjust-set="${setKey}" data-set-field="reps" data-set-delta="1" aria-label="Increase reps">+</button>
          </div>
        </td>
        <td>
          <select class="set-rir-input" data-set-rir="${setKey}" aria-label="Set ${setIndex + 1} RIR">
            ${[0, 1, 2, 3, 4].map((rir) => `<option value="${rir}" ${Number(rirValue) === rir ? "selected" : ""}>${rir === 4 ? "4+" : rir}</option>`).join("")}
          </select>
        </td>
        <td>
          <label class="set-complete" title="Mark set complete">
            <input type="checkbox" data-complete-set="${exerciseKey}:${setIndex + 1}" ${completedSets[setIndex] ? "checked" : ""} />
            <span>Done</span>
          </label>
        </td>
      </tr>
    `;
    }).join("");

    return `
      <details class="exercise-dropdown" data-exercise-key="${exerciseKey}" ${
        openExerciseKeys.has(exerciseKey) || (!hasExistingExerciseState && index === 0) ? "open" : ""
      }>
        <summary>
          <span class="routine-expander" aria-hidden="true"></span>
          <span class="exercise-summary-text">
            <strong>${exerciseName}</strong>
            ${nextSessionNote}
          </span>
          <label class="exercise-complete" title="Mark exercise complete">
            <input type="checkbox" data-complete-exercise="${exerciseKey}" ${completed ? "checked" : ""} />
            <span>All done</span>
          </label>
        </summary>
        <div class="table-wrap">
          <div class="exercise-timer" data-exercise-timer="${exerciseKey}">
            <span><strong>Rest timer</strong> <span class="exercise-timer-value">${formatSeconds(restTimerValue)}</span></span>
            <span class="exercise-timer-actions">
              <button class="small-btn timer-btn" type="button" data-start-exercise-timer="${exerciseKey}">${restTimerActive ? "Pause" : "Start"}</button>
              <button class="small-btn timer-btn" type="button" data-reset-exercise-timer="${exerciseKey}">Reset</button>
            </span>
          </div>
          <table class="exercise-table">
            <thead>
              <tr><th>Set</th><th>Previous</th><th>Suggested weight</th><th>Suggested reps</th><th>RIR</th><th>Done</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </details>
    `;
  }).join("");

  els.routineExerciseList.querySelectorAll("[data-complete-exercise]").forEach((checkbox) => {
    checkbox.addEventListener("click", (event) => event.stopPropagation());
    checkbox.addEventListener("change", () => {
      const exerciseKey = checkbox.dataset.completeExercise;
      setExerciseCompletion(exerciseKey, checkbox.checked);
    });
  });

  els.routineExerciseList.querySelectorAll("[data-complete-set]").forEach((checkbox) => {
    checkbox.addEventListener("click", (event) => event.stopPropagation());
    checkbox.addEventListener("change", () => {
      const parts = checkbox.dataset.completeSet.split(":");
      const setNumber = Number(parts.pop());
      const exerciseKey = parts.join(":");
      setSetCompletion(exerciseKey, setNumber, checkbox.checked);
    });
  });

  els.routineExerciseList.querySelectorAll("[data-set-weight], [data-set-reps], [data-set-rir]").forEach((input) => {
    input.addEventListener("click", (event) => event.stopPropagation());
    input.addEventListener("change", () => {
      const setKey = input.dataset.setWeight || input.dataset.setReps || input.dataset.setRir;
      const field = input.dataset.setWeight ? "weight" : input.dataset.setReps ? "reps" : "rir";
      const value = Number(input.value);
      if (!state.pendingSetValues[setKey]) {
        state.pendingSetValues[setKey] = {};
      }
      state.pendingSetValues[setKey][field] = value;
    });
  });

  els.routineExerciseList.querySelectorAll("[data-adjust-set]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const setKey = button.dataset.adjustSet;
      const field = button.dataset.setField;
      const delta = Number(button.dataset.setDelta);
      const input = button.parentElement.querySelector(field === "weight" ? "[data-set-weight]" : "[data-set-reps]");
      const current = Number(state.pendingSetValues[setKey]?.[field] ?? input?.value ?? 0);
      if (!state.pendingSetValues[setKey]) {
        state.pendingSetValues[setKey] = {};
      }
      state.pendingSetValues[setKey][field] = Math.max(field === "weight" ? 0 : 1, Number((current + delta).toFixed(2)));
      renderRoutinePage();
    });
  });

  els.routineExerciseList.querySelectorAll("[data-start-exercise-timer]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleExerciseRestTimer(button.dataset.startExerciseTimer);
    });
  });

  els.routineExerciseList.querySelectorAll("[data-reset-exercise-timer]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      resetExerciseRestTimer(button.dataset.resetExerciseTimer);
    });
  });
}

function getSuggestedRestTime(exercise) {
  if (exercise[5] === "Cardio") {
    return "60 sec";
  }

  if (["Chest", "Back", "Quads", "Hamstrings", "Glutes"].includes(exercise[6])) {
    return "120 sec";
  }

  return "90 sec";
}

function getRestDuration(exerciseKey) {
  const [day, exerciseName] = exerciseKey.split(":");
  const exercise = PROGRAM[day]?.find(([name]) => name === exerciseName);
  if (!exercise) return 90;
  return Number.parseInt(getSuggestedRestTime(exercise), 10) || 90;
}

function toggleExerciseRestTimer(exerciseKey) {
  if (state.restActive && state.restExerciseKey === exerciseKey) {
    clearInterval(state.restTimerId);
    state.restActive = false;
    state.restStartedAt = null;
    state.restTimerId = null;
    render();
    return;
  }

  clearInterval(state.restTimerId);
  state.restExerciseKey = exerciseKey;
  state.restDuration = getRestDuration(exerciseKey);
  state.restSeconds = state.restDuration;
  state.restStartedAt = Date.now();
  state.restActive = true;
  startRestTimer();
  render();
}

function resetExerciseRestTimer(exerciseKey) {
  if (state.restExerciseKey === exerciseKey) {
    clearInterval(state.restTimerId);
    state.restActive = false;
    state.restStartedAt = null;
    state.restTimerId = null;
  }
  state.restExerciseKey = exerciseKey;
  state.restDuration = getRestDuration(exerciseKey);
  state.restSeconds = state.restDuration;
  render();
}

function isSetCompleted(day, exerciseName, setNumber) {
  return state.data.logs.some((entry) => (
    entry.date === getTodayKey()
    && entry.day === day
    && entry.exercise === exerciseName
    && Number(entry.setNumber) === setNumber
  ));
}

function setExerciseCompletion(exerciseKey, completed) {
  const [day, exerciseName] = exerciseKey.split(":");
  const exercise = PROGRAM[day].find(([name]) => name === exerciseName);
  if (!exercise) {
    return;
  }

  for (let setNumber = 1; setNumber <= exercise[1]; setNumber += 1) {
    setSetCompletion(exerciseKey, setNumber, completed, false);
  }

  saveData();
  render();
}

function setSetCompletion(exerciseKey, setNumber, completed, shouldRender = true) {
  const [day, exerciseName] = exerciseKey.split(":");
  const exercise = PROGRAM[day].find(([name]) => name === exerciseName);
  if (!exercise) {
    return;
  }

  if (completed && !isSetCompleted(day, exerciseName, setNumber)) {
    const recommendation = buildRecommendation(exerciseName);
    const logs = state.data.logs.filter((entry) => entry.exercise === exerciseName && entry.day === day);
    const previous = logs.length ? logs[logs.length - 1] : null;
    const setKey = `${exerciseKey}:${setNumber}`;
    state.data.logs.push({
      date: getTodayKey(),
      createdAt: new Date().toISOString(),
      day,
      exercise: exerciseName,
      setNumber,
      weight: state.pendingSetValues[setKey]?.weight ?? (recommendation.value || Number(previous?.weight || 0)),
      reps: state.pendingSetValues[setKey]?.reps ?? getExerciseTargetReps(exercise).exact,
      rir: state.pendingSetValues[setKey]?.rir ?? 2,
    });
    state.historySelectedDates[day] = getTodayKey();
  } else if (!completed) {
    state.data.logs = state.data.logs.filter((entry) => !(
      entry.date === getTodayKey()
      && entry.day === day
      && entry.exercise === exerciseName
      && Number(entry.setNumber) === setNumber
    ));
  }

  if (shouldRender) {
    saveData();
    render();
  }
}

function endRoutine() {
  const userName = (state.data.userName || getStoredUserName() || "USER").trim() || "USER";
  const completedSets = state.data.logs.filter((entry) => (
    entry.day === state.selectedDay && entry.date === getTodayKey()
  )).length;

  if (!Array.isArray(state.data.routineHistory)) {
    state.data.routineHistory = [];
  }

  state.data.userName = userName;
  state.data.routineHistory.push({
    routine: ROUTINES[state.selectedDay].name,
    day: state.selectedDay,
    date: new Date().toISOString(),
    userName,
    completedSets,
  });

  saveData();
  persistActiveFile();
  createDailyRecoveryFile();
  state.completedExercises = {};
  state.activePage = "routines";
  state.phase = "idle";
  render();
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

function getHistoryDateKey(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return formatStamp(new Date(value)).slice(0, 10);
}

function formatHistoryDate(value) {
  const dateKey = getHistoryDateKey(value);
  if (!dateKey) return "Unknown date";
  const date = new Date(`${dateKey}T12:00:00`);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function getRoutineSessions(day) {
  const sessions = new Map();
  state.data.logs
    .filter((entry) => entry.day === day)
    .forEach((entry) => {
      const dateKey = getHistoryDateKey(entry.date);
      if (!sessions.has(dateKey)) sessions.set(dateKey, { date: dateKey, logs: [], completedSets: 0 });
      const session = sessions.get(dateKey);
      session.logs.push(entry);
      session.completedSets += 1;
    });

  (state.data.routineHistory || [])
    .filter((entry) => entry.day === day)
    .forEach((entry) => {
      const dateKey = getHistoryDateKey(entry.date);
      if (!sessions.has(dateKey)) sessions.set(dateKey, { date: dateKey, logs: [], completedSets: 0 });
      const session = sessions.get(dateKey);
      session.completedSets = Math.max(session.completedSets, Number(entry.completedSets || 0));
    });

  return [...sessions.values()].sort((left, right) => right.date.localeCompare(left.date));
}

function getHistorySessionLimit(day, sessions) {
  if (state.historySessionLimits[day]) {
    return Math.min(state.historySessionLimits[day], sessions.length);
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartKey = formatStamp(weekStart).slice(0, 10);
  const recentCount = sessions.filter((session) => session.date >= weekStartKey).length;
  return Math.min(sessions.length, Math.max(recentCount, sessions.length ? 1 : 0));
}

function renderHistory() {
  const sections = DAYS.map((day) => {
    const routine = ROUTINES[day];
    const sessions = getRoutineSessions(day);
    const visibleSessionCount = getHistorySessionLimit(day, sessions);
    const visibleSessions = sessions.slice(0, visibleSessionCount);
    const hasOlderSessions = visibleSessionCount < sessions.length;
    const selectedDate = state.historySelectedDates[day] && sessions.some((session) => session.date === state.historySelectedDates[day])
      ? state.historySelectedDates[day]
      : sessions[0]?.date || "";
    const exerciseRows = PROGRAM[day].map((exercise) => {
      const name = exercise[0];
      const logs = state.data.logs.filter((entry) => (
        entry.day === day && entry.exercise === name && entry.date === selectedDate
      ));
      const last = logs[logs.length - 1];
      const guidance = getExerciseGuidance(day, name, selectedDate);
      const lastResult = last ? `${last.weight} kg x ${last.reps} reps, RIR ${last.rir ?? "-"}` : "No logged sets this session";
      return `
        <tr>
          <td><strong>${name}</strong></td>
          <td>${last ? formatHistoryDate(last.date) : "-"}</td>
          <td>${lastResult}</td>
          <td>
            <strong class="history-signal signal-${guidance.signal.toLowerCase().replaceAll(" ", "-")}">${guidance.signal}</strong>
            <span class="history-next-step">${guidance.value ? `${guidance.value} kg next` : guidance.label}</span>
          </td>
        </tr>
      `;
    }).join("");

    const sessionRows = sessions.length
      ? visibleSessions.map((session) => {
        const volume = session.logs.reduce((sum, entry) => sum + Number(entry.weight || 0) * Number(entry.reps || 0), 0);
        const exercises = new Set(session.logs.map((entry) => entry.exercise)).size;
        const selected = session.date === selectedDate ? " selected-history-session" : "";
        return `<tr class="history-session-row${selected}" data-history-session="${day}" data-history-date="${session.date}" tabindex="0"><td><strong>${formatHistoryDate(session.date)}</strong></td><td>${session.completedSets}</td><td>${exercises}</td><td>${volume.toFixed(1)} kg</td></tr>`;
      }).join("")
      : '<tr><td class="empty-state" colspan="4">No sessions recorded yet.</td></tr>';

    return `
      <details class="history-routine" ${sessions.length ? "open" : ""}>
        <summary>
          <span><strong>${routine.name}</strong><small>${routine.focus}</small></span>
          <span class="history-session-count">${sessions.length} session${sessions.length === 1 ? "" : "s"}</span>
        </summary>
        <div class="history-routine-body">
          <div class="history-block">
            <div class="history-block-heading">
              <h3>Session ledger</h3>
              <span>${sessions.length ? `${formatHistoryDate(selectedDate)} selected` : "No activity"}</span>
            </div>
            <div class="history-table-wrap">
              <table class="history-table session-table">
                <thead><tr><th>Session date</th><th>Sets</th><th>Exercises</th><th>Volume</th></tr></thead>
                <tbody>${sessionRows}</tbody>
              </table>
            </div>
            ${hasOlderSessions ? `<button class="history-load-more" type="button" data-history-load="${day}">Load older sessions <span>+${sessions.length - visibleSessionCount}</span></button>` : ""}
          </div>
          <div class="history-block">
              <div class="history-block-heading">
              <h3>Exercise outlook</h3>
              <span>${selectedDate ? `Based on ${formatHistoryDate(selectedDate)}` : "Next session"}</span>
            </div>
            <div class="history-table-wrap">
              <table class="history-table history-exercise-table">
                <thead><tr><th>Exercise</th><th>Last logged</th><th>Last performance</th><th>Decision</th></tr></thead>
                <tbody>${exerciseRows}</tbody>
              </table>
            </div>
          </div>
        </div>
      </details>
    `;
  }).join("");

  els.historyContent.innerHTML = sections;
  els.historyContent.querySelectorAll("[data-history-session]").forEach((row) => {
    const selectSession = () => {
      state.historySelectedDates[row.dataset.historySession] = row.dataset.historyDate;
      renderHistory();
    };
    row.addEventListener("click", selectSession);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectSession();
      }
    });
  });
  els.historyContent.querySelectorAll("[data-history-load]").forEach((button) => {
    button.addEventListener("click", () => {
      const day = button.dataset.historyLoad;
      state.historySessionLimits[day] = (state.historySessionLimits[day] || getHistorySessionLimit(day, getRoutineSessions(day))) + 6;
      renderHistory();
    });
  });
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
    const repTarget = getExerciseTargetReps(exercise);
    els.sessionCard.innerHTML = `
      <div class="phase-tag">Ready</div>
      <h2 class="exercise-title">${exercise[0]}</h2>
      <div class="exercise-meta">
        ${state.selectedDay} · ${exercise[1]} sets · ${repTarget.display} reps · ${exercise[5]} · ${exercise[6]}
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
    const repTarget = getExerciseTargetReps(exercise);
    els.sessionCard.innerHTML = `
      <div class="phase-tag">Warm-up</div>
      <h2 class="exercise-title">${exercise[0]}</h2>
      <div class="exercise-meta">
        ${state.selectedDay} · ${exercise[1]} sets · ${repTarget.display} reps
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
  const repTarget = getExerciseTargetReps(exercise);
  const completedToday = state.data.logs.filter((entry) => entry.day === state.selectedDay && entry.date === getTodayKey());

  els.sessionCard.innerHTML = `
    <div class="phase-tag">Exercise ${state.currentExerciseIndex + 1}/${PROGRAM[state.selectedDay].length}</div>
    <h2 class="exercise-title">${exercise[0]}</h2>
    <div class="exercise-meta">
      ${exercise[1]} sets · ${repTarget.display} reps · ${exercise[5]} · ${exercise[6]} · Target RIR 2
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
      createdAt: new Date().toISOString(),
      day: state.selectedDay,
      exercise: exercise[0],
      setNumber: state.currentSetNumber,
      weight: state.weight,
      reps: state.reps,
      rir: state.rir,
    };

    state.data.logs.push(entry);
    state.historySelectedDates[state.selectedDay] = entry.date;
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
    state.reps = getExerciseTargetReps(exercise).exact;
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
      state.restStartedAt = null;
      state.restTimerId = null;
    } else {
      state.restActive = true;
      state.restExerciseKey = null;
      state.restDuration = 90;
      state.restSeconds = 90;
      state.restStartedAt = Date.now();
      startRestTimer();
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

function updateRestTimer() {
  if (!state.restActive || !state.restStartedAt) {
    return;
  }

  const elapsedSeconds = Math.floor((Date.now() - state.restStartedAt) / 1000);
  state.restSeconds = Math.max(0, state.restDuration - elapsedSeconds);

  if (state.restSeconds === 0) {
    clearInterval(state.restTimerId);
    state.restActive = false;
    state.restStartedAt = null;
    state.restTimerId = null;
  }
}

function startRestTimer() {
  clearInterval(state.restTimerId);
  state.restTimerId = setInterval(() => {
    const previousSeconds = state.restSeconds;
    updateRestTimer();
    if (state.restSeconds !== previousSeconds || !state.restActive) {
      render();
    }
  }, 250);
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
  const userName = (state.data.userName || getStoredUserName() || "USER").trim() || "USER";
  if (els.userNameInput) {
    els.userNameInput.value = userName;
  }

  const eyebrow = document.getElementById("userPossessiveLabel");
  if (eyebrow) {
    eyebrow.textContent = `${userName}'s`;
  }

  if (els.userProfileDisplay) {
    els.userProfileDisplay.textContent = `${userName}'s`;
  }

  if (els.selectedRoutineLabel) {
    els.selectedRoutineLabel.textContent = ROUTINES[state.selectedDay].name;
  }

  renderRoutinePage();
  renderDaySelector();
  renderStats();
  renderSession();
  renderWeeklySummary();
  renderPRs();
  renderRecentLog();
  renderHistory();
  updateBackupStatus();
  renderTabs();
}

function renderTabs() {
  const activeTab = state.activeTab || "workout";
  els.workoutView.classList.toggle("hidden", activeTab !== "workout");
  els.userView.classList.toggle("hidden", activeTab !== "user");
  els.dataView.classList.toggle("hidden", activeTab !== "data");
  els.historyView.classList.toggle("hidden", activeTab !== "history");

  els.tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === activeTab;
    button.classList.toggle("active", isActive);
  });
}

els.userNameInput?.addEventListener("input", () => {
  saveUserName();
});

els.tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.activeTab = button.dataset.tab;
    els.topbarActions.classList.remove("open");
    els.menuToggle.setAttribute("aria-expanded", "false");
    renderTabs();
  });
});

els.menuToggle.addEventListener("click", () => {
  const isOpen = els.topbarActions.classList.toggle("open");
  els.menuToggle.setAttribute("aria-expanded", String(isOpen));
});

els.menuClose.addEventListener("click", () => {
  els.topbarActions.classList.remove("open");
  els.menuToggle.setAttribute("aria-expanded", "false");
});

els.startBtn.addEventListener("click", () => {
  state.phase = "warmup";
  state.currentExerciseIndex = 0;
  state.currentSetNumber = 1;
  render();
});

els.backToRoutinesBtn.addEventListener("click", () => {
  state.activePage = "routines";
  state.phase = "idle";
  render();
});

els.endRoutineBtn.addEventListener("click", endRoutine);

els.exportBtn.addEventListener("click", () => {
  exportData();
});

els.openFileBtn.addEventListener("click", async () => {
  await openFilePicker();
});

els.importBtn.addEventListener("click", async () => {
  await openFilePicker();
});

els.resetBtn.addEventListener("click", () => {
  state.data = { logs: [] };
  saveData();
  state.phase = "idle";
  state.currentExerciseIndex = 0;
  state.currentSetNumber = 1;
  render();
});

els.saveNowBtn.addEventListener("click", async () => {
  await saveActiveFile();
  render();
  alert("Active file saved.");
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && state.restActive) {
    updateRestTimer();
    render();
  }
});

window.addEventListener("beforeunload", (event) => {
  autoDailyBackup();
  persistActiveFile();

  if (state.fileHandle) {
    event.preventDefault();
    event.returnValue = "You have an open workout file. Save before leaving?";
  }
});

setInterval(() => {
  saveData();
  persistActiveFile();
  createDailyRecoveryFile();
}, 60000);

restoreFromDailyBackupIfAvailable();
autoDailyBackup();
createDailyRecoveryFile();
render();
