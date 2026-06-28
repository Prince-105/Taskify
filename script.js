let draggedItem = null;
let selectedTask = null;
let seconds = 0;
let timerInterval;

/* INIT */
document.addEventListener("DOMContentLoaded", () => {
  setupDrag();
  setupDelete();
  setupInputs();   // 🔥 important
  loadData();
});

/* CREATE TASK */
function createTask(text, container, data = {}) {
  const task = document.createElement("div");
  task.className = "task";
  task.textContent = text;
  task.draggable = true;

  // ✅ Persistent data
  task.dataset.start = data.start || "";
  task.dataset.deadline = data.deadline || "";
  task.dataset.notes = data.notes || "";
  task.dataset.time = data.time || 0;

  task.addEventListener("click", () => selectTask(task));

  task.addEventListener("dragstart", () => {
    draggedItem = task;
    task.classList.add("dragging");
    document.getElementById("deleteZone").classList.add("active");
  });

  task.addEventListener("dragend", () => {
    task.classList.remove("dragging");
    draggedItem = null;
    document.getElementById("deleteZone").classList.remove("active");
    saveData();
  });

  container.appendChild(task);
  saveData();
}

/* SELECT TASK */
function selectTask(task) {
  selectedTask = task;

  // Highlight selected
  document.querySelectorAll(".task").forEach(t => t.classList.remove("active"));
  task.classList.add("active");

  document.getElementById("taskTitle").textContent = task.textContent;
  document.getElementById("startDate").value = task.dataset.start || "";
  document.getElementById("deadline").value = task.dataset.deadline || "";
  document.getElementById("notes").value = task.dataset.notes || "";

  seconds = parseInt(task.dataset.time) || 0;
  updateDisplay();
}

/* INPUT HANDLERS (FIXED PROPERLY) */
function setupInputs() {
  const notes = document.getElementById("notes");
  const start = document.getElementById("startDate");
  const deadline = document.getElementById("deadline");

  notes.addEventListener("input", () => {
    if (!selectedTask) return;
    selectedTask.dataset.notes = notes.value;
    saveData();
  });

  start.addEventListener("change", () => {
    if (!selectedTask) return;
    selectedTask.dataset.start = start.value;
    saveData();
  });

  deadline.addEventListener("change", () => {
    if (!selectedTask) return;
    selectedTask.dataset.deadline = deadline.value;
    saveData();
  });
}

/* ADD TASK */
function quickAddTask(column) {
  const list = column.querySelector(".task-list");

  const input = document.createElement("input");
  input.className = "form-control";
  input.placeholder = "Enter task...";
  list.appendChild(input);
  input.focus();

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && input.value.trim()) {
      createTask(input.value, list);
      input.remove();
    }
  });
}

/* DRAG */
function setupDrag() {
  document.querySelectorAll(".column").forEach(col => {
    col.addEventListener("dragover", e => {
      e.preventDefault();
      const list = col.querySelector(".task-list");

      const after = getAfter(list, e.clientY);
      if (!after) list.appendChild(draggedItem);
      else list.insertBefore(draggedItem, after);
    });
  });
}

function getAfter(container, y) {
  const items = [...container.querySelectorAll(".task:not(.dragging)")];

  return items.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    }
    return closest;
  }, { offset: -9999 }).element;
}

/* DELETE */
function setupDelete() {
  const zone = document.getElementById("deleteZone");

  zone.addEventListener("dragover", e => e.preventDefault());

  zone.addEventListener("drop", () => {
    if (draggedItem) {
      draggedItem.remove();
      draggedItem = null;
      saveData();
    }
  });
}

/* SAVE DATA */
function saveData() {
  const data = [];

  document.querySelectorAll(".column").forEach(col => {
    const tasks = [];

    col.querySelectorAll(".task").forEach(t => {
      tasks.push({
        text: t.textContent,
        start: t.dataset.start,
        deadline: t.dataset.deadline,
        notes: t.dataset.notes,
        time: t.dataset.time
      });
    });

    data.push(tasks);
  });

  localStorage.setItem("kanban", JSON.stringify(data));
}

/* LOAD DATA */
function loadData() {
  const saved = JSON.parse(localStorage.getItem("kanban"));
  if (!saved) return;

  const columns = document.querySelectorAll(".column");

  saved.forEach((col, i) => {
    col.forEach(task => {
      createTask(task.text, columns[i].querySelector(".task-list"), task);
    });
  });
}

/* TIMER */
function updateDisplay() {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');

  document.getElementById("timerDisplay").textContent = `${h}:${m}:${s}`;
}

function startTimer() {
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    seconds++;
    updateDisplay();

    if (selectedTask) {
      selectedTask.dataset.time = seconds;
      saveData();
    }

  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function resetTimer() {
  clearInterval(timerInterval);
  seconds = 0;
  updateDisplay();

  if (selectedTask) {
    selectedTask.dataset.time = 0;
    saveData();
  }
}