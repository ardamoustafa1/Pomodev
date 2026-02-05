// Pomodev Chrome Extension - Popup Script

// Timer state
let timer = null;
let isRunning = false;
let currentMode = 'pomodoro';
let remainingTime = 25 * 60;
let todayPomodoros = 0;
let weekPomodoros = 0;
let currentStreak = 0;
let xp = 0;
let level = 1;

const durations = {
    pomodoro: 25 * 60,
    short: 5 * 60,
    long: 15 * 60
};

const modeMessages = {
    pomodoro: 'Odaklanma Zamanı',
    short: 'Kısa Mola',
    long: 'Uzun Mola'
};

// DOM Elements
const timerDisplay = document.getElementById('timer');
const timerMode = document.getElementById('timerMode');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const todayCountEl = document.getElementById('todayCount');
const weekCountEl = document.getElementById('weekCount');
const streakCountEl = document.getElementById('streakCount');
const xpBar = document.getElementById('xpBar');
const levelText = document.getElementById('levelText');
const xpText = document.getElementById('xpText');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadState();
    updateDisplay();
    setupEventListeners();
});

function setupEventListeners() {
    startBtn.addEventListener('click', toggleTimer);
    resetBtn.addEventListener('click', resetTimer);

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setMode(btn.dataset.mode);
        });
    });
}

async function loadState() {
    const data = await chrome.storage.local.get([
        'remainingTime', 'isRunning', 'currentMode', 'endTime',
        'todayPomodoros', 'weekPomodoros', 'currentStreak', 'xp', 'level'
    ]);

    if (data.currentMode) currentMode = data.currentMode;
    if (data.todayPomodoros) todayPomodoros = data.todayPomodoros;
    if (data.weekPomodoros) weekPomodoros = data.weekPomodoros;
    if (data.currentStreak) currentStreak = data.currentStreak;
    if (data.xp) xp = data.xp;
    if (data.level) level = data.level;

    // Check if timer was running
    if (data.endTime && data.isRunning) {
        const now = Date.now();
        if (now < data.endTime) {
            remainingTime = Math.floor((data.endTime - now) / 1000);
            isRunning = true;
            startTimer();
        } else {
            remainingTime = durations[currentMode];
        }
    } else {
        remainingTime = data.remainingTime || durations[currentMode];
    }
}

async function saveState() {
    await chrome.storage.local.set({
        remainingTime,
        isRunning,
        currentMode,
        endTime: isRunning ? Date.now() + remainingTime * 1000 : null,
        todayPomodoros,
        weekPomodoros,
        currentStreak,
        xp,
        level
    });
}

function updateDisplay() {
    const minutes = Math.floor(remainingTime / 60).toString().padStart(2, '0');
    const seconds = (remainingTime % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${minutes}:${seconds}`;
    timerMode.textContent = modeMessages[currentMode];

    startBtn.textContent = isRunning ? 'DURAKLAT' : 'BAŞLAT';

    // Update stats
    todayCountEl.textContent = todayPomodoros;
    weekCountEl.textContent = weekPomodoros;
    streakCountEl.textContent = currentStreak;

    // Update XP
    const nextLevelXP = level * 100;
    const progress = Math.min(100, (xp % nextLevelXP) / nextLevelXP * 100);
    xpBar.style.width = `${progress}%`;
    levelText.textContent = `Lvl ${level}`;
    xpText.textContent = `${xp % nextLevelXP} / ${nextLevelXP} XP`;

    // Update mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === currentMode);
    });
}

function toggleTimer() {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    isRunning = true;
    updateDisplay();
    saveState();

    timer = setInterval(() => {
        remainingTime--;
        updateDisplay();

        if (remainingTime <= 0) {
            timerComplete();
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timer);
    isRunning = false;
    updateDisplay();
    saveState();
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    remainingTime = durations[currentMode];
    updateDisplay();
    saveState();
}

function setMode(mode) {
    if (isRunning) {
        pauseTimer();
    }
    currentMode = mode;
    remainingTime = durations[mode];
    updateDisplay();
    saveState();
}

function timerComplete() {
    clearInterval(timer);
    isRunning = false;

    if (currentMode === 'pomodoro') {
        todayPomodoros++;
        weekPomodoros++;
        xp += 100;

        // Level up check
        if (xp >= level * 100) {
            level++;
        }

        // Send notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: '⏱ Pomodoro Tamamlandı!',
            message: `Harika! ${todayPomodoros}. pomodoro'nu tamamladın. +100 XP!`,
            priority: 2
        });

        // Switch to short or long break
        if (todayPomodoros % 4 === 0) {
            setMode('long');
        } else {
            setMode('short');
        }
    } else {
        // Break complete - back to pomodoro
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: '⏰ Mola Bitti!',
            message: 'Odaklanma zamanı geldi!',
            priority: 2
        });
        setMode('pomodoro');
    }

    saveState();
    updateDisplay();
}
