// --- Initial State ---
let tasks = [];
let stats = { totalMinutes: 0, sessions: 0 };
let currentTaskIndex = null;
let timeLeft = 0;
let focusMinutes = 25;
let timerInterval = null;
let isPaused = false;

// --- Initialize Icons ---
lucide.createIcons();

// --- Theme Logic ---
function updateTheme() {
    const hour = new Date().getHours();
    const body = document.body;
    let themeData = {};

    if (hour >= 6 && hour < 18) {
        body.className = 'theme-morning';
        themeData = { name: 'Morning Mode', label: '☀️ Morning Mode Active', mode: 'morning' };
    } else if (hour >= 18 && hour < 20) {
        body.className = 'theme-evening';
        themeData = { name: 'Evening Mode', label: '🌙 Blue Hour Active', mode: 'evening' };
    } else {
        body.className = 'theme-night';
        themeData = { name: 'Night Mode', label: '🌑 Night Mode Active', mode: 'night' };
    }

    document.getElementById('theme-name').innerText = themeData.name;
    document.getElementById('theme-label').innerText = themeData.label;
    return themeData.mode;
}

// --- Navigation ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${screenId}`).classList.add('active');
}

// --- Task Management ---
document.getElementById('add-task-btn').addEventListener('click', () => {
    const title = document.getElementById('task-title').value;
    const energy = document.getElementById('task-energy').value;
    const deadline = document.getElementById('task-deadline').value;

    if (!title || !deadline) return;

    const task = { id: Date.now(), title, energy, deadline };
    tasks.push(task);
    renderTasks();

    document.getElementById('task-title').value = '';
    document.getElementById('task-deadline').value = '';
});

function renderTasks() {
    const list = document.getElementById('task-list');
    const count = document.getElementById('queue-count');
    count.innerText = tasks.length;

    if (tasks.length === 0) {
        list.innerHTML = '<div class="empty-state">Your study queue is empty</div>';
        return;
    }

    list.innerHTML = tasks.map(t => `
        <div class="task-item">
            <div>
                <div style="font-weight: bold; font-size: 0.9rem">${t.title}</div>
                <div style="font-size: 0.7rem; opacity: 0.6">${t.energy} energy • ${t.deadline} days left</div>
            </div>
            <button onclick="removeTask(${t.id})" style="background:none; border:none; color:red; cursor:pointer">×</button>
        </div>
    `).join('');
}

function removeTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
}

// --- Processing & Timer ---
document.getElementById('start-study-btn').addEventListener('click', () => {
    if (tasks.length === 0) return;
    processTask(0);
});

function processTask(index) {
    currentTaskIndex = index;
    const task = tasks[index];
    const mode = updateTheme();
    
    let reason = '';
    let suggestion = '';

    if (mode === 'evening') {
        reason = '🌙 Blue Hour: Light tasks only';
        suggestion = `Review: ${task.title}`;
        focusMinutes = 15;
        document.getElementById('blue-hour-note').classList.remove('hidden');
    } else {
        reason = task.energy === 'high' ? '🔥 High Energy: Deep Work' : '⚖️ Balanced Study';
        suggestion = task.energy === 'high' ? `Deep Work: ${task.title}` : `Study: ${task.title}`;
        focusMinutes = 25;
        document.getElementById('blue-hour-note').classList.add('hidden');
    }

    document.getElementById('suggested-title').innerText = suggestion;
    document.getElementById('suggested-reason').innerText = reason;
    document.getElementById('current-task-num').innerText = index + 1;
    document.getElementById('total-tasks-num').innerText = tasks.length;
    document.getElementById('focus-mins').innerText = focusMinutes;

    showScreen('suggestion');
}

function adjustMinutes(amount) {
    const mode = updateTheme();
    const max = mode === 'evening' ? 15 : 60;
    focusMinutes = Math.max(5, Math.min(max, focusMinutes + amount));
    document.getElementById('focus-mins').innerText = focusMinutes;
}

document.getElementById('start-timer-btn').addEventListener('click', () => {
    timeLeft = focusMinutes * 60;
    isPaused = false;
    showScreen('timer');
    startTimer();
});

function startTimer() {
    document.getElementById('timer-task-name').innerText = `Currently: ${tasks[currentTaskIndex].title}`;
    clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        if (isPaused) return;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            completeSession();
            return;
        }

        timeLeft--;
        updateTimerUI();
    }, 1000);
}

function updateTimerUI() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    document.getElementById('timer-text').innerText = `${m}:${s.toString().padStart(2, '0')}`;
    
    // SVG Progress
    const total = focusMinutes * 60;
    const offset = 283 - (283 * (timeLeft / total));
    document.getElementById('progress-ring').style.strokeDashoffset = offset;
}

function completeSession() {
    stats.sessions++;
    stats.totalMinutes += focusMinutes;
    
    document.getElementById('stat-time').innerText = `${Math.floor(stats.totalMinutes/60)}h ${stats.totalMinutes%60}m`;
    document.getElementById('stat-sessions').innerText = stats.sessions;
    
    setTimeout(() => {
        if (currentTaskIndex + 1 < tasks.length) {
            processTask(currentTaskIndex + 1);
        } else {
            tasks = [];
            renderTasks();
            showScreen('input');
        }
    }, 2000);
}

document.getElementById('pause-btn').addEventListener('click', (e) => {
    isPaused = !isPaused;
    e.target.innerText = isPaused ? 'Resume' : 'Pause';
});

document.getElementById('stop-btn').addEventListener('click', () => {
    clearInterval(timerInterval);
    showScreen('suggestion');
});

// Run theme check on load
updateTheme();
