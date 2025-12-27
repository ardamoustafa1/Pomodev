// Pomodoro zamanlayıcı değişkenleri
let timer;
let isRunning = false;
let currentMode = 'pomodoro';
let cycleCount = 0;

// Arka plan kontrolü için değişkenler
let backgroundStartTime = 0;
let backgroundDuration = 0;
let isPageVisible = true;

const durations = {
    pomodoro: 25 * 60,
    short: 5 * 60,
    long: 15 * 60
};

let remainingTime = durations.pomodoro;
let endTimestamp = 0; // Wall-clock based timer için bitiş zamanı

// Ayar değişkenleri
let autoStartBreaks = false;
let autoStartPomodoros = false;
let autoCheckTasks = false;
let autoSwitchTasks = true;
let longBreakInterval = 4; // Default interval

// İstatistik değişkenleri
let dailyGoal = 8;
let todayPomodoros = 0;
let weekPomodoros = 0;
let currentStreak = 0;
let pomodoroHistory = [];
let taskHistory = [];
let notificationsEnabled = false;

// 🔊 Sesler
let tickAudio = new Audio();

// ===== Data Persistence Layer =====
class DataManager {
    constructor() {
        this.STORAGE_KEY = 'pomodevData';
        this.XP_KEY = 'pomodevXP';
    }

    /**
     * Saves application state.
     * @param {Object} data - The state object to save
     * @returns {Promise<boolean>}
     */
    async save(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            // TODO: Cloud Sync Implementation
            // await this.cloudSave(data);
            return true;
        } catch (e) {
            console.error('Data Save Failed:', e);
            return false;
        }
    }

    /**
     * Loads application state.
     * @returns {Promise<Object|null>}
     */
    async load() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Data Load Failed:', e);
            return null;
        }
    }

    /**
     * Updates and retrieves User XP.
     * @param {number} amount - XP to add
     * @returns {number} New total XP
     */
    addXP(amount) {
        let xp = parseInt(localStorage.getItem(this.XP_KEY) || '0');
        xp += amount;
        localStorage.setItem(this.XP_KEY, xp.toString());
        return xp;
    }

    getXP() {
        return parseInt(localStorage.getItem(this.XP_KEY) || '0');
    }

    setXP(value) {
        localStorage.setItem(this.XP_KEY, value.toString());
        return value;
    }
}

const dataManager = new DataManager();

// ===== Gamification Logic =====

// 💬 Motivasyon Mesajları
const MOTIVATION_MESSAGES = [
    "🔥 Harika! 25 dakika derin odak tamamlandı!",
    "💪 Muhteşem! Bir pomodoro daha!",
    "🧠 Beynin güçleniyor! Devam et!",
    "⚡ Enfes! Odak kasın büyüyor!",
    "🎯 Hedefine bir adım daha yaklaştın!",
    "🚀 Roket gibi ilerliyorsun!",
    "✨ Parlıyorsun! Harika iş!",
    "🏆 Şampiyonlar gibi çalışıyorsun!",
    "🌟 Yıldız gibi parla!",
    "💎 Değerli ilerleme kaydediyorsun!"
];

const STREAK_MESSAGES = {
    3: "🔥 3 gün streak! Alışkanlık oluşmaya başladı!",
    5: "⭐ 5 gün! Harika disiplin!",
    7: "🌟 1 haftalık streak! Muhteşem!",
    14: "🏆 2 hafta! Artık bir alışkanlık ustasısın!",
    21: "💎 3 hafta! Efsanevi disiplin!",
    30: "👑 1 ay streak! Sen bir efsanesin!"
};

const COMPARISON_MESSAGES = {
    better: (percent) => `📈 Dünden %${percent} daha iyisin!`,
    same: "🎯 Dünkü tempoyu yakaladın!",
    worse: (needed) => `💪 Dünkü ${needed} pomodoro'yu yakala!`,
    first: "🌱 İlk günün başarılı geçiyor!"
};

class GamificationManager {
    constructor() {
        this.levels = [];
        // Level 1-50 calculation: Base 100 XP, 1.2 multiplier
        // L1: 0-100, L2: 100-220, etc.
        let xp = 0;
        for (let i = 1; i <= 50; i++) {
            this.levels.push({ level: i, xp: Math.floor(xp) });
            xp += 100 * Math.pow(1.1, i - 1);
        }
    }

    getLevel(xp) {
        for (let i = this.levels.length - 1; i >= 0; i--) {
            if (xp >= this.levels[i].xp) {
                return this.levels[i].level;
            }
        }
        return 1;
    }

    getTitle(level) {
        if (level >= 50) return "Time Lord ⏳";
        if (level >= 45) return "Grandmaster 👑";
        if (level >= 40) return "Zen Ustası 🧘";
        if (level >= 35) return "Flow Master 🌊";
        if (level >= 30) return "Deep Worker 🧠";
        if (level >= 25) return "Productivity Pro 💼";
        if (level >= 20) return "Focus Expert 🎯";
        if (level >= 15) return "Odaklanmış 🔥";
        if (level >= 10) return "Apprentice 📚";
        if (level >= 5) return "Starter 🌿";
        return "Novice 🌱";
    }

    getNextLevelXP(currentLevel) {
        if (currentLevel >= 50) return Infinity;
        return this.levels[currentLevel].xp; // Index is level-1, so next level is at index `level`
    }

    getProgress(xp) {
        const level = this.getLevel(xp);
        const currentLevelXP = this.levels[level - 1].xp;
        const nextLevelXP = this.getNextLevelXP(level);

        if (nextLevelXP === Infinity) return 100;

        const required = nextLevelXP - currentLevelXP;
        const earned = xp - currentLevelXP;
        return Math.min(100, Math.floor((earned / required) * 100));
    }
}

// XP Popup göster
function showXPGain(amount, reason) {
    const popup = document.createElement('div');
    popup.className = 'xp-popup';
    popup.innerHTML = `<span class="xp-amount">+${amount} XP</span><span class="xp-reason">${reason}</span>`;
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.8);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px 40px;
        border-radius: 16px;
        font-weight: 700;
        font-size: 1.5rem;
        text-align: center;
        z-index: 10000;
        box-shadow: 0 20px 60px rgba(102, 126, 234, 0.4);
        animation: xpPopupAnim 2s ease-out forwards;
        display: flex;
        flex-direction: column;
        gap: 8px;
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 2000);
}

// Motivasyon mesajı göster
function showMotivationMessage() {
    const msg = MOTIVATION_MESSAGES[Math.floor(Math.random() * MOTIVATION_MESSAGES.length)];
    const toast = document.createElement('div');
    toast.className = 'motivation-toast';
    toast.textContent = msg;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 16px 32px;
        border-radius: 50px;
        font-weight: 600;
        font-size: 1.1rem;
        z-index: 10000;
        animation: toastSlide 3s ease-out forwards;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Streak mesajı kontrol
function checkStreakMilestone(streak) {
    if (STREAK_MESSAGES[streak]) {
        setTimeout(() => {
            showNotification("🔥 Streak Milestone!", STREAK_MESSAGES[streak]);
        }, 2500);
    }
}

const gameManager = new GamificationManager();

document.addEventListener('DOMContentLoaded', () => {
    displayTime();
    updateFocusMessage();
    updateModeStyles();
    setupSettingsModal();
    setupThemeControls();
    setupStatistics();
    setupNotifications();
    setupFullscreen();
    setupKeyboardShortcuts();
    setupPageVisibility();
    setupTitleRemaining();
    setupGoalNotesInit();
    setupDragAndArchive();
    setupShareSettings();
    setupCalendarQuickAdd();
    setupSessionSummary();
    setupStreakReminder();
    setupFloatingMini();
    setupDropdown();
    loadData().then(() => {
        updateGamificationUI();
    });
    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
    setupHowItWorks();
});

// ===== VISUAL EFFECTS =====
function triggerFocusCompleteEffect() {
    const effect = localStorage.getItem('pomodev_active_effect') || 'confetti';

    if (effect === 'confetti') {
        launchConfetti();
    } else if (effect === 'fireworks') {
        launchFireworks();
        setTimeout(launchFireworks, 500);
        setTimeout(launchFireworks, 1000);
    }
}

function launchFireworks() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.width = '6px';
        particle.style.height = '6px';
        particle.style.borderRadius = '50%';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        // Start from random screen position (simulating multiple rockets)
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * window.innerHeight * 0.5; // Top half

        particle.style.left = startX + 'px';
        particle.style.top = startY + 'px';
        particle.style.zIndex = '9999';

        document.body.appendChild(particle);

        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 150 + 50;

        const destX = startX + Math.cos(angle) * velocity;
        const destY = startY + Math.sin(angle) * velocity;

        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${Math.cos(angle) * velocity}px, ${Math.sin(angle) * velocity}px) scale(0)`, opacity: 0 }
        ], {
            duration: 1000,
            easing: 'ease-out'
        }).onfinish = () => particle.remove();
    }
}

function launchConfetti() {
    const colors = ['#ff4d4f', '#52c41a', '#1890ff', '#faad14', '#fadb14', '#eb2f96'];
    for (let i = 0; i < 100; i++) {
        const confetto = document.createElement('div');
        confetto.style.position = 'fixed';
        confetto.style.width = Math.random() * 8 + 4 + 'px';
        confetto.style.height = Math.random() * 8 + 4 + 'px';
        confetto.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetto.style.left = Math.random() * 100 + 'vw';
        confetto.style.top = '-10px';
        confetto.style.zIndex = '9999';
        confetto.style.pointerEvents = 'none';

        // Random fall duration and horizontal movement
        const duration = Math.random() * 2 + 2 + 's';

        confetto.animate([
            { transform: `translate3d(0,0,0) rotate(0deg)`, opacity: 1 },
            { transform: `translate3d(${Math.random() * 100 - 50}px, 100vh, 0) rotate(${Math.random() * 720}deg)`, opacity: 0 }
        ], {
            duration: parseFloat(duration) * 1000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }).onfinish = () => confetto.remove();

        document.body.appendChild(confetto);
    }
}

async function syncProgress() {
    const user = JSON.parse(localStorage.getItem('pomodev_user'));
    if (!user) return; // Not logged in

    const xp = dataManager.getXP();
    const level = gameManager.getLevel(xp);

    // Gather ALL user data
    const inventory = localStorage.getItem('pomodev_inventory') || '[]';
    const stats = localStorage.getItem('pomodevData') || '{}';
    const tasks = localStorage.getItem('pomodev_tasks') || '[]';

    // Settings
    const settings = JSON.stringify({
        theme: localStorage.getItem('theme') || 'dark',
        accent: localStorage.getItem('accent') || 'blue',
        pomodev_active_theme: localStorage.getItem('pomodev_active_theme') || 'default',
        pomodev_active_effect: localStorage.getItem('pomodev_active_effect') || 'confetti'
    });

    try {
        await fetch('/api/save_user_data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: user.username,
                xp: xp,
                level: level,
                inventory: inventory,
                stats: stats,
                settings: settings,
                tasks: tasks
            })
        });
        console.log('✅ All user data synced to cloud');
    } catch (err) {
        console.error('Failed to sync user data:', err);
    }
}

function updateGamificationUI() {
    const xp = dataManager.getXP();
    const level = gameManager.getLevel(xp);
    const title = gameManager.getTitle(level);
    const progress = gameManager.getProgress(xp);

    const levelText = document.getElementById('levelText');
    const xpBar = document.getElementById('xpBar');
    const levelBadge = document.getElementById('levelBadge');

    if (levelText) levelText.textContent = `Lvl ${level}`;
    if (xpBar) xpBar.style.width = `${progress}%`;
    if (levelBadge) {
        // Check Potion for UI
        const potionEnd = parseInt(localStorage.getItem('xp_potion_end') || '0');
        const isActive = Date.now() < potionEnd;

        levelBadge.title = `${title} (${xp} XP)${isActive ? ' [🧪 2x Active]' : ''}`;
        if (isActive) {
            levelBadge.style.boxShadow = '0 0 10px #ae00ff'; // Glowing effect
        } else {
            levelBadge.style.boxShadow = '';
        }
    }
}

function checkLevelUp(oldXP, newXP) {
    const oldLevel = gameManager.getLevel(oldXP);
    const newLevel = gameManager.getLevel(newXP);

    if (newLevel > oldLevel) {
        showNotification("🎉 Level Up!", `Congratulations! You reached Level ${newLevel}: ${gameManager.getTitle(newLevel)}`);
        // Add visual flare
        const badge = document.getElementById('levelBadge');
        if (badge) {
            badge.classList.add('level-up-anim');
            setTimeout(() => badge.classList.remove('level-up-anim'), 1000);
        }
    }
}


function displayTime() {
    const minutes = Math.floor(remainingTime / 60).toString().padStart(2, '0');
    const seconds = (remainingTime % 60).toString().padStart(2, '0');
    document.getElementById('timer').textContent = `${minutes}:${seconds}`;

    // Timer mode'u güncelle
    const modeText = document.getElementById('focusMsg');
    if (currentMode === 'pomodoro') {
        modeText.innerHTML = `#${cycleCount}<br />Time to focus!`;
    } else if (currentMode === 'short') {
        modeText.innerHTML = `Short Break<br />Take a rest!`;
    } else if (currentMode === 'long') {
        modeText.innerHTML = `Long Break<br />Relax & recharge!`;
    }
}

function setupHowItWorks() {
    const btn = document.getElementById('howItWorksBtn');
    const modal = document.getElementById('howItWorksModal');
    const closeBtn = document.getElementById('closeHowItWorks');
    if (!btn || !modal || !closeBtn) return;
    btn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    });
    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });
}

// Tema ve accent kontrolü
function setupThemeControls() {
    const root = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    const accentSelect = document.getElementById('accentSelect');

    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedAccent = localStorage.getItem('accent') || 'blue';
    root.setAttribute('data-theme', savedTheme);
    root.setAttribute('data-accent', savedAccent);
    if (accentSelect) accentSelect.value = savedAccent;
    if (themeToggle) themeToggle.textContent = savedTheme === 'light' ? '☀️' : '🌙';

    themeToggle?.addEventListener('click', () => {
        const current = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        root.setAttribute('data-theme', current);
        localStorage.setItem('theme', current);
        themeToggle.textContent = current === 'light' ? '☀️' : '🌙';
    });

    accentSelect?.addEventListener('change', (e) => {
        const value = e.target.value;
        root.setAttribute('data-accent', value);
        localStorage.setItem('accent', value);
    });
}

function startTimer() {
    const startBtn = document.querySelector('.start-btn');

    if (isRunning) {
        // PAUSE
        clearInterval(timer);
        isRunning = false;
        startBtn.textContent = 'START';
        tickAudio.pause();

        // Kalan süreyi wall-clock'tan güncelle
        if (endTimestamp > 0) {
            remainingTime = Math.max(0, Math.floor((endTimestamp - Date.now()) / 1000));
            displayTime();
        }

        // Analytics: Timer paused
        if (window.trackEvent) {
            trackEvent('timer_paused', {
                mode: currentMode,
                time_remaining: remainingTime
            });
        }
        return;
    }

    // START
    // Yeni pomodoro başlangıcında hedef sor
    if (currentMode === 'pomodoro' && remainingTime === durations.pomodoro) {
        promptGoalBeforeStart();
        return; // Modal kapanınca actuallyStartTimer() çağrılacak
    }

    // Normal başlatma (mola sonrası devam veya pomodoro bitmişse)
    isRunning = true;
    startBtn.textContent = 'PAUSE';
    updateTickSound();

    // Zen Mode Check
    if (localStorage.getItem('pomodev_active_effect') === 'zen') {
        document.body.classList.add('zen-mode');
    }

    // Wall-clock based timer: bitiş zamanını hesapla
    endTimestamp = Date.now() + remainingTime * 1000;

    // Safety: Clear existing timer before starting new one
    if (timer) clearInterval(timer);
    timer = setInterval(timerTick, 1000);

    // Analytics: Timer started
    if (window.trackEvent) {
        trackEvent('timer_started', {
            mode: currentMode,
            duration: durations[currentMode]
        });
    }
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    remainingTime = durations[currentMode];
    endTimestamp = 0; // endTimestamp'i sıfırla
    displayTime();
    document.querySelector('.start-btn').textContent = 'START';
    tickAudio.pause();
    tickAudio.src = '';

    // Disable Zen Mode
    document.body.classList.remove('zen-mode');

    // Hedefi temizle
    const goalDisplay = document.getElementById('currentGoalDisplay');
    if (goalDisplay) {
        goalDisplay.textContent = '';
    }
    currentPomodoroGoal = '';
}

function setMode(mode) {
    currentMode = mode;
    resetTimer();
    updateFocusMessage();
    updateModeStyles();
}

function updateModeStyles() {
    document.querySelectorAll('.mode').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(currentMode)) {
            btn.classList.add('active');
        }
    });
}

function updateFocusMessage() {
    const msgBox = document.getElementById("focusMsg");
    if (!msgBox) return;

    switch (currentMode) {
        case 'pomodoro':
            msgBox.innerHTML = "#1<br>Time to focus!";
            break;
        case 'short':
            msgBox.innerHTML = "Take a short break!";
            break;
        case 'long':
            msgBox.innerHTML = "Enjoy a long break!";
            break;
    }
}

// ===== HEDEF & NOTLAR =====
let currentPomodoroGoal = '';
function setupGoalNotesInit() {
    const modal = document.getElementById('goalModal');
    const input = document.getElementById('goalInput');
    const saveBtn = document.getElementById('goalSaveBtn');
    const cancelBtn = document.getElementById('goalCancelBtn');
    if (!modal || !input || !saveBtn || !cancelBtn) return;

    cancelBtn.addEventListener('click', () => closeGoalModal());
    saveBtn.addEventListener('click', () => {
        currentPomodoroGoal = (input.value || '').trim();
        closeGoalModal();
        setTimeout(() => actuallyStartTimer(), 100);
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            currentPomodoroGoal = (input.value || '').trim();
            closeGoalModal();
            setTimeout(() => actuallyStartTimer(), 100);
        }
        if (e.key === 'Escape') {
            closeGoalModal();
        }
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeGoalModal();
    });
}
function openGoalModal() {
    const modal = document.getElementById('goalModal');
    const input = document.getElementById('goalInput');
    if (!modal || !input) return;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    input.value = '';
    setTimeout(() => input.focus(), 0);
}
function closeGoalModal() {
    const modal = document.getElementById('goalModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}
function promptGoalBeforeStart() {
    openGoalModal();
}
function actuallyStartTimer() {
    // Safety: Clear existing timer before starting new one
    if (timer) clearInterval(timer);

    isRunning = true;
    document.querySelector('.start-btn').textContent = 'PAUSE';
    updateTickSound();

    // Recalculate end timestamp for accuracy
    endTimestamp = Date.now() + remainingTime * 1000;
    timer = setInterval(timerTick, 1000);

    // Hedefi göster
    const goalDisplay = document.getElementById('currentGoalDisplay');
    if (goalDisplay && currentPomodoroGoal) {
        goalDisplay.textContent = `🎯 ${currentPomodoroGoal}`;
    }
}
function promptCompletedNote() {
    // Not prompt kaldırıldı
}

// ===== STREAK =====
function updateStreak() {
    const byDate = new Set(pomodoroHistory.map(e => new Date(e.timestamp).toDateString()));
    let streak = 0;
    const today = new Date();
    for (let i = 0; ; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        if (byDate.has(d.toDateString())) streak++; else break;
    }
    currentStreak = streak;
}

// ===== SÜRÜKLE-BIRAK & ARŞİV =====
function setupDragAndArchive() {
    const list = document.getElementById('taskList');
    if (list) {
        list.addEventListener('dragstart', e => {
            if (e.target.classList.contains('task-item')) {
                e.dataTransfer.setData('text/plain', '');
                e.target.classList.add('dragging');
            }
        });
        list.addEventListener('dragend', e => {
            if (e.target.classList.contains('task-item')) {
                e.target.classList.remove('dragging');
                saveTaskOrder();
            }
        });
        list.addEventListener('dragover', e => {
            e.preventDefault();
            const after = getDragAfterElement(list, e.clientY);
            const dragging = document.querySelector('.dragging');
            if (!dragging) return;
            if (after == null) list.appendChild(dragging); else list.insertBefore(dragging, after);
        });
    }
    const archiveBtn = document.getElementById('archiveCompletedBtn');
    archiveBtn?.addEventListener('click', () => {
        const tasks = Array.from(document.querySelectorAll('.task-item.completed'));
        tasks.forEach(t => t.remove());
        saveData();
    });
}
function getDragAfterElement(container, y) {
    const els = [...container.querySelectorAll('.task-item:not(.dragging)')];
    return els.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset, element: child }; else return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}
function saveTaskOrder() {
    const titles = [...document.querySelectorAll('.task-item h4')].map(h => h.textContent);
    localStorage.setItem('taskOrder', JSON.stringify(titles));
}

// ===== BAŞLIKTA ZAMAN =====
function setupTitleRemaining() {
    const baseTitle = document.title;
    setInterval(() => {
        if (!document.hidden || !isRunning) { document.title = baseTitle; return; }
        const m = Math.floor(remainingTime / 60).toString().padStart(2, '0');
        const s = (remainingTime % 60).toString().padStart(2, '0');
        document.title = `⏱️ ${m}:${s} – ${baseTitle}`;
    }, 1000);
}

// ===== AYARLARI PAYLAŞ =====
function setupShareSettings() {
    const btn = document.getElementById('shareSettingsBtn');
    btn?.addEventListener('click', () => {
        const payload = {
            theme: document.documentElement.getAttribute('data-theme') || 'dark',
            accent: document.documentElement.getAttribute('data-accent') || 'blue',
            durations,
            dailyGoal
        };
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
        const url = `${location.origin}${location.pathname}?s=${encoded}`;
        navigator.clipboard.writeText(url).then(() => alert('Ayar linki kopyalandı!'));
    });
    const params = new URLSearchParams(location.search);
    const s = params.get('s');
    if (s) {
        try {
            const decoded = JSON.parse(decodeURIComponent(escape(atob(s))));
            if (decoded.theme) document.documentElement.setAttribute('data-theme', decoded.theme);
            if (decoded.accent) document.documentElement.setAttribute('data-accent', decoded.accent);
            if (decoded.durations) {
                durations.pomodoro = decoded.durations.pomodoro || durations.pomodoro;
                durations.short = decoded.durations.short || durations.short;
                durations.long = decoded.durations.long || durations.long;
                remainingTime = durations[currentMode];
            }
            if (decoded.dailyGoal) dailyGoal = decoded.dailyGoal;
            updateStatistics();
            displayTime();
        } catch { }
    }
}

// export/import kaldırıldı

// ===== TAKVİM HIZLI EKLE =====
function setupCalendarQuickAdd() {
    document.getElementById('quickAddCalendar')?.addEventListener('click', () => {
        const minutes = currentMode === 'pomodoro' ? (durations.pomodoro / 60) : currentMode === 'short' ? (durations.short / 60) : (durations.long / 60);
        const title = currentMode === 'pomodoro' ? (currentPomodoroGoal || 'Pomodoro') : (currentMode === 'short' ? 'Short Break' : 'Long Break');
        const start = new Date();
        const end = new Date(start.getTime() + minutes * 60000);
        const fmt = d => d.toISOString().replace(/[-:]|\.\d{3}/g, '').slice(0, 15) + 'Z';
        const url = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent(title)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent('Pomodev seansı')}`;
        window.open(url, '_blank');
    });
}

// ===== SESSION SUMMARY & SHARING =====
function setupSessionSummary() {
    document.getElementById('shareStatsBtn')?.addEventListener('click', showSessionSummary);
    document.getElementById('closeSummaryBtn')?.addEventListener('click', () => {
        document.getElementById('sessionSummaryModal')?.classList.add('hidden');
        document.body.style.overflow = '';
        localStorage.setItem('noAutoSummary', 'true');
    });
    document.getElementById('copyLinkBtn')?.addEventListener('click', () => {
        const text = `Bugün ${todayPomodoros} pomodoro tamamladım! ${currentStreak} gün streak! 🎉`;
        navigator.clipboard.writeText(text + '\n' + window.location.href).then(() => alert('Kopyalandı!'));
    });
    document.getElementById('shareTwitter')?.addEventListener('click', () => {
        const text = encodeURIComponent(`Bugün ${todayPomodoros} pomodoro tamamladım! ${currentStreak} gün streak! 🎉 ${window.location.href}`);
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    });
    document.getElementById('shareFacebook')?.addEventListener('click', () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
    });
    document.getElementById('shareWhatsapp')?.addEventListener('click', () => {
        const text = encodeURIComponent(`Bugün ${todayPomodoros} pomodoro tamamladım! 🎉`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    });
}
function showSessionSummary() {
    document.getElementById('summaryPomodoros').textContent = todayPomodoros;
    document.getElementById('summaryStreak').textContent = currentStreak;
    const modal = document.getElementById('sessionSummaryModal');
    modal?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}
// 🔔 Alarm sesi oynat (5 saniyelik)
function playAlarm() {
    const selectedSound = document.getElementById('alarmSound').value;
    const repeatCount = parseInt(document.getElementById('alarmRepeat').value) || 1;
    const volume = (parseInt(document.getElementById('alarmVolume').value) || 50) / 100;

    const alarmAudio = document.getElementById("alarm");
    alarmAudio.src = `/static/sounds/${selectedSound}.wav`;
    alarmAudio.volume = volume;

    let count = 1; // ilk çalma
    alarmAudio.currentTime = 0;
    alarmAudio.play().catch(err => console.warn("Alarm çalınamadı:", err));

    // 5 saniye sonra sesi durdur
    setTimeout(() => {
        alarmAudio.pause();
        alarmAudio.currentTime = 0; // başa sar
    }, 5000); // 5000ms = 5 saniye

    alarmAudio.onended = () => {
        if (count < repeatCount) {
            // Play alarm
            alarmAudio.currentTime = 0;
            alarmAudio.play();

            // Trigger customized shop effect
            triggerFocusCompleteEffect();

            // Notify
            showNotification(currentMode === 'pomodoro' ? "Time's up!" : "Break is over!",
                currentMode === 'pomodoro' ? "Take a break." : "Get back to work!");

            // Loop wait logic (simple timeout for loop delay if needed)
            setTimeout(() => {
                alarmAudio.pause();
                alarmAudio.currentTime = 0;
            }, 5000);
        }
    };
}


function updateTickSound() {
    const selectedTick = document.getElementById('tickSound').value;
    const volume = (parseInt(document.getElementById('tickVolume').value) || 50) / 100;

    if (selectedTick === 'none') {
        tickAudio.pause();
        tickAudio.src = '';
        return;
    }

    tickAudio.src = `/static/sounds/${selectedTick}.wav`;
    tickAudio.loop = true;
    tickAudio.volume = volume;

    if (isRunning) {
        tickAudio.play(); // Sadece Pomodoro çalışıyorsa başlat
    }
}


function setupSettingsModal() {
    const settingsBtn = document.getElementById('settingsBtn');
    const modal = document.getElementById('settingsModal');
    const closeBtn = document.getElementById('closeSettings');

    if (!settingsBtn || !modal || !closeBtn) return;

    const pomodoroInput = document.getElementById('pomodoroDuration');
    const shortBreakInput = document.getElementById('shortBreak');
    const longBreakInput = document.getElementById('longBreak');
    const longBreakIntervalInput = document.getElementById('longBreakInterval');
    const autoStartBreaksCheckbox = document.getElementById('autoStartBreaks');
    const autoStartPomodorosCheckbox = document.getElementById('autoStartPomodoros');
    const autoCheckTasksCheckbox = document.getElementById('autoCheckTasks');
    const autoSwitchTasksCheckbox = document.getElementById('autoSwitchTasks');
    const alarmSoundSelect = document.getElementById('alarmSound');
    const alarmRepeatInput = document.getElementById('alarmRepeat');
    const alarmVolumeInput = document.getElementById('alarmVolume');
    const tickSoundSelect = document.getElementById('tickSound');
    const tickVolumeInput = document.getElementById('tickVolume');

    settingsBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        pomodoroInput.value = durations.pomodoro / 60;
        shortBreakInput.value = durations.short / 60;
        longBreakInput.value = durations.long / 60;
        longBreakIntervalInput.value = longBreakInterval; // Use variable

        autoStartBreaksCheckbox.checked = autoStartBreaks;
        autoStartPomodorosCheckbox.checked = autoStartPomodoros;
        autoCheckTasksCheckbox.checked = autoCheckTasks;
        autoSwitchTasksCheckbox.checked = autoSwitchTasks;

        // Load saved sound settings from localStorage
        dataManager.load().then(savedData => {
            if (savedData) {
                alarmSoundSelect.value = savedData.alarmSound || 'kitchen';
                alarmRepeatInput.value = savedData.alarmRepeat || 1;
                alarmVolumeInput.value = savedData.alarmVolume || 50;
                tickSoundSelect.value = savedData.tickSound || 'none';
                tickVolumeInput.value = savedData.tickVolume || 50;
            } else {
                alarmSoundSelect.value = 'kitchen';
                alarmRepeatInput.value = 1;
                alarmVolumeInput.value = 50;
                tickSoundSelect.value = 'none';
                tickVolumeInput.value = 50;
            }
        });
    });

    // Save and Close
    function saveSettings() {
        const newPomodoro = parseInt(pomodoroInput.value);
        const newShort = parseInt(shortBreakInput.value);
        const newLong = parseInt(longBreakInput.value);
        const newInterval = parseInt(longBreakIntervalInput.value);

        if (!isNaN(newPomodoro) && newPomodoro > 0) {
            durations.pomodoro = newPomodoro * 60;
            if (currentMode === 'pomodoro' && !isRunning) {
                remainingTime = durations.pomodoro;
                displayTime();
            }
        }
        if (!isNaN(newShort) && newShort > 0) {
            durations.short = newShort * 60;
            if (currentMode === 'short' && !isRunning) {
                remainingTime = durations.short;
                displayTime();
            }
        }
        if (!isNaN(newLong) && newLong > 0) {
            durations.long = newLong * 60;
            if (currentMode === 'long' && !isRunning) {
                remainingTime = durations.long;
                displayTime();
            }
        }

        if (!isNaN(newInterval) && newInterval > 0) {
            longBreakInterval = newInterval;
        }

        autoStartBreaks = autoStartBreaksCheckbox.checked;
        autoStartPomodoros = autoStartPomodorosCheckbox.checked;
        autoCheckTasks = autoCheckTasksCheckbox.checked;
        autoSwitchTasks = autoSwitchTasksCheckbox.checked;

        updateTickSound();
        saveData(); // Persist changes
    }

    // Expose saveSettings globally so Escape handler can use it
    window.saveSettings = saveSettings;

    closeBtn.addEventListener('click', () => {
        saveSettings();
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    });

    // Click outside to save & close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            saveSettings();
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });

    // Ses seviye kontrolleri için gerçek zamanlı event listener'lar
    alarmVolumeInput.addEventListener('input', () => {
        const volume = (parseInt(alarmVolumeInput.value) || 50) / 100;
        const alarmAudio = document.getElementById("alarm");
        if (alarmAudio) {
            alarmAudio.volume = volume;
        }
    });

    tickVolumeInput.addEventListener('input', () => {
        const volume = (parseInt(tickVolumeInput.value) || 50) / 100;
        if (tickAudio) {
            tickAudio.volume = volume;
        }
    });

    // Alarm sesi değiştiğinde test et
    alarmSoundSelect.addEventListener('change', () => {
        const selectedSound = alarmSoundSelect.value;
        const volume = (parseInt(alarmVolumeInput.value) || 50) / 100;
        const alarmAudio = document.getElementById("alarm");
        if (alarmAudio) {
            alarmAudio.src = `/static/sounds/${selectedSound}.wav`;
            alarmAudio.volume = volume;
            // Kısa test sesi çal
            alarmAudio.currentTime = 0;
            alarmAudio.play().catch(err => console.warn("Test alarm çalınamadı:", err));
            setTimeout(() => alarmAudio.pause(), 1000); // 1 saniye sonra durdur
        }
    });

    // Tık sesi değiştiğinde test et
    tickSoundSelect.addEventListener('change', () => {
        const selectedTick = tickSoundSelect.value;
        const volume = (parseInt(tickVolumeInput.value) || 50) / 100;

        if (selectedTick === 'none') {
            tickAudio.pause();
            tickAudio.src = '';
            return;
        }

        tickAudio.src = `/static/sounds/${selectedTick}.wav`;
        tickAudio.loop = false; // Test için döngü kapalı
        tickAudio.volume = volume;

        // Kısa test sesi çal
        tickAudio.currentTime = 0;
        tickAudio.play().catch(err => console.warn("Test tık sesi çalınamadı:", err));
        setTimeout(() => tickAudio.pause(), 1000); // 1 saniye sonra durdur
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });
}

function incrementPomodoro() {
    const input = document.getElementById('pomodoroCount');
    input.value = parseInt(input.value) + 1;
}

function decrementPomodoro() {
    const input = document.getElementById('pomodoroCount');
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
    }
}

function closeTaskModal() {
    const taskModal = document.getElementById('taskModal');
    if (taskModal) {
        taskModal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function addTask() {
    const taskModal = document.getElementById('taskModal');
    if (taskModal) {
        taskModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Click outside to close
        taskModal.addEventListener('click', function closeOnOutside(e) {
            if (e.target === taskModal) {
                taskModal.classList.add('hidden');
                document.body.style.overflow = '';
                taskModal.removeEventListener('click', closeOnOutside);
            }
        });
    }
}

function saveTask() {
    const title = document.getElementById('taskTitle').value;
    const pomos = document.getElementById('pomodoroCount').value;
    const category = document.getElementById('taskCategory')?.value || 'work';
    const priority = document.getElementById('priority')?.value || 'normal';
    const note = document.getElementById('taskNote')?.value || '';
    const project = document.getElementById('taskProject')?.value || '';
    const dueDate = document.getElementById('dueDate')?.value || '';
    const tagsRaw = document.getElementById('taskTags')?.value || '';
    const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);

    if (!title.trim()) {
        alert("Lütfen görev başlığı girin.");
        return;
    }

    const taskList = document.getElementById('taskList');
    const taskElement = document.createElement('div');
    taskElement.className = 'task-item';
    taskElement.setAttribute('draggable', 'true');
    taskElement.dataset.category = category;
    taskElement.dataset.priority = priority;

    const priorityLabels = {
        'low': 'Düşük',
        'normal': 'Normal',
        'important': 'Önemli',
        'urgent': 'Acil'
    };

    const categoryLabels = {
        'work': 'İş',
        'personal': 'Kişisel',
        'learning': 'Öğrenme'
    };

    const priorityLabel = priorityLabels[priority] || priority;
    const categoryLabel = categoryLabels[category] || category;
    const tagsChips = tags.map(t => `<span class="chip">${t}</span>`).join(' ');

    taskElement.innerHTML = `
        <div>
            <h4>${title}</h4>
            <p class="meta">
              <span>⏱️ ${pomos} pomodoro</span>
              <span class="badge badge-${priority}">${priorityLabel}</span>
              <span class="badge badge-category">${categoryLabel}</span>
              ${project ? `<span>📁 ${project}</span>` : ''}
              ${dueDate ? `<span>📅 ${dueDate}</span>` : ''}
            </p>
            ${tags.length ? `<p>${tagsChips}</p>` : ''}
            ${note ? `<p>📝 ${note}</p>` : ''}
        </div>
        <div class="task-actions">
            <button onclick="completeTask(this)" class="complete-btn">✓</button>
            <button onclick="deleteTask(this)" class="delete-btn">🗑️</button>
        </div>
    `;

    taskList?.appendChild(taskElement);

    // Görev geçmişine ekle
    taskHistory.push({
        id: Date.now(),
        title,
        category,
        priority,
        pomos: parseInt(pomos),
        createdAt: new Date().toISOString(),
        completed: false
    });

    saveData();
    closeTaskModal();
}

function completeTask(button) {
    const taskElement = button.closest('.task-item');
    taskElement.classList.add('completed');
    button.textContent = '✓';
    button.disabled = true;

    // Görev geçmişini güncelle
    const taskTitle = taskElement.querySelector('h4').textContent;
    const task = taskHistory.find(t => t.title === taskTitle);
    if (task) {
        task.completed = true;
        task.completedAt = new Date().toISOString();
    }

    updateTaskCompletionRate();
    saveData();
}

function deleteTask(button) {
    const taskElement = button.closest('.task-item');
    const taskTitle = taskElement.querySelector('h4').textContent;

    if (confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
        taskElement.remove();

        // Görev geçmişinden kaldır
        taskHistory = taskHistory.filter(t => t.title !== taskTitle);

        updateTaskCompletionRate();
        saveData();
    }
}

// ===== İSTATİSTİKLER FONKSİYONLARI =====
function setupStatistics() {
    const statsToggle = document.getElementById('statsToggle');
    const statsContent = document.getElementById('statsContent');

    if (statsToggle && statsContent) {
        statsToggle.addEventListener('click', () => {
            statsContent.classList.toggle('hidden');
            statsToggle.textContent = statsContent.classList.contains('hidden') ? '📈' : '📊';
        });
    }

    updateStatistics();
}

function updateStatistics() {
    // Bugünkü pomodoro sayısını güncelle
    document.getElementById('todayPomodoros').textContent = todayPomodoros;

    // Haftalık pomodoro sayısını hesapla ve güncelle
    weekPomodoros = calculateWeekPomodoros();
    document.getElementById('weekPomodoros').textContent = weekPomodoros;

    // Streak'i güncelle
    document.getElementById('currentStreak').textContent = currentStreak;

    // Hedef ilerlemesini güncelle
    const goalProgress = document.getElementById('goalProgress');
    const progressBar = document.getElementById('goalProgressBar');
    const progress = Math.min((todayPomodoros / dailyGoal) * 100, 100);

    goalProgress.textContent = `${todayPomodoros}/${dailyGoal}`;
    progressBar.style.width = `${progress}%`;

    // Üretkenlik raporunu güncelle
    updateProductivityReport();
}

function updateGoal() {
    const goalInput = document.getElementById('dailyGoal');
    dailyGoal = parseInt(goalInput.value) || 8;
    updateStatistics();
    saveData();
}

// ===== BİLDİRİMLER =====
function setupNotifications() {
    const notificationsBtn = document.getElementById('notificationsBtn');

    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', async () => {
            if (notificationsEnabled) {
                notificationsEnabled = false;
                notificationsBtn.classList.remove('enabled');
                notificationsBtn.textContent = '🔔';
            } else {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    notificationsEnabled = true;
                    notificationsBtn.classList.add('enabled');
                    notificationsBtn.textContent = '🔕';
                } else {
                    alert('Bildirim izni verilmedi. Lütfen tarayıcı ayarlarından izin verin.');
                }
            }
            saveData();
        });
    }
}

function showNotification(title, body, badge = null) {
    if (notificationsEnabled && Notification.permission === 'granted') {
        const options = {
            body: body,
            icon: '/static/favicon.ico',
            badge: '/static/favicon.ico',
            requireInteraction: false,
            tag: 'pomodev-notification'
        };

        // Badge değeri varsa ekle
        if (badge !== null) {
            options.badge = badge;
        }

        const notification = new Notification(title, options);

        // 5 saniye sonra otomatik kapat
        setTimeout(() => {
            notification.close();
        }, 5000);

        // Tıklandığında pencereyi odakla
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
}

// ===== TAM EKRAN MODU =====
function setupFullscreen() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().then(() => {
                    fullscreenBtn.textContent = '⛶';
                });
            } else {
                document.exitFullscreen().then(() => {
                    fullscreenBtn.textContent = '⛶';
                });
            }
        });
    }
}

// ===== KLAVYE KISAYOLLARI =====
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Escape - Modalları kapat (her zaman çalışmalı)
        if (e.key === 'Escape') {
            const settingsModal = document.getElementById('settingsModal');
            if (settingsModal && !settingsModal.classList.contains('hidden')) {
                if (window.saveSettings) window.saveSettings();
            }

            const modals = document.querySelectorAll('.modal:not(.hidden)');
            modals.forEach(modal => {
                modal.classList.add('hidden');
                document.body.style.overflow = '';
            });
            return; // Escape tuşu işlendikten sonra çık
        }

        // Modal açıksa diğer kısayollar devre dışı
        const goalModal = document.getElementById('goalModal');
        const settingsModal = document.getElementById('settingsModal');
        const taskModal = document.getElementById('taskModal');
        if (!goalModal?.classList.contains('hidden') ||
            !settingsModal?.classList.contains('hidden') ||
            !taskModal?.classList.contains('hidden')) {
            return;
        }

        // Space - Başlat/Durdur
        if (e.code === 'Space' && !e.target.matches('input, textarea, select')) {
            e.preventDefault();
            startTimer();
        }

        // R - Reset (but not when typing in input fields)
        if ((e.key === 'r' || e.key === 'R') && !e.target.matches('input, textarea, select')) {
            e.preventDefault();
            resetTimer();
        }

        // S - Settings (but not when typing in input fields)
        if ((e.key === 's' || e.key === 'S') && !e.target.matches('input, textarea, select')) {
            e.preventDefault();
            document.getElementById('settingsBtn').click();
        }
    });
}

// ===== VERİ YÖNETİMİ =====
function saveData() {
    const data = {
        dailyGoal,
        todayPomodoros,
        weekPomodoros,
        currentStreak,
        pomodoroHistory,
        taskHistory,
        notificationsEnabled,
        durations, // Save custom durations
        autoStartBreaks,
        autoStartPomodoros,
        autoCheckTasks,
        autoSwitchTasks,
        longBreakInterval, // Save interval
        // Sound settings
        alarmSound: document.getElementById('alarmSound')?.value || 'kitchen',
        alarmRepeat: parseInt(document.getElementById('alarmRepeat')?.value) || 1,
        alarmVolume: parseInt(document.getElementById('alarmVolume')?.value) || 50,
        tickSound: document.getElementById('tickSound')?.value || 'none',
        tickVolume: parseInt(document.getElementById('tickVolume')?.value) || 50
    };

    // Use DataManager
    dataManager.save(data).then(success => {
        if (!success) console.warn("Save operation had issues.");
    });
}

async function loadData() {
    // const savedData = localStorage.getItem('pomodevData'); // OLD
    const data = await dataManager.load(); // NEW

    const today = new Date().toDateString();
    const lastVisitDate = localStorage.getItem('lastVisitDate');

    if (data) {
        // const data = JSON.parse(savedData); // Handled by DataManager
        dailyGoal = data.dailyGoal || 8;

        // Bugünkü tarihi kontrol et
        if (lastVisitDate !== today) {
            // Yeni gün - sadece bugünün sayacını sıfırla
            todayPomodoros = 0;

            // Geçmiş pomodoro geçmişini filtrele (30 günden eski olanları temizle)
            if (data.pomodoroHistory) {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                pomodoroHistory = data.pomodoroHistory.filter(p => {
                    const pomodoroDate = new Date(p.timestamp);
                    return pomodoroDate >= thirtyDaysAgo;
                });
            } else {
                pomodoroHistory = [];
            }

            // Haftalık pomodoro sayısını hesapla
            weekPomodoros = calculateWeekPomodoros();

            // Streak'i güncelle
            updateStreak();

            // Tarih kaydını güncelle
            localStorage.setItem('lastVisitDate', today);
        } else {
            // Aynı gün - değerleri koru
            todayPomodoros = data.todayPomodoros || 0;
            weekPomodoros = data.weekPomodoros || 0;
            currentStreak = data.currentStreak || 0;
            pomodoroHistory = data.pomodoroHistory || [];
        }

        // Restore durations
        if (data.durations) {
            durations.pomodoro = data.durations.pomodoro || durations.pomodoro;
            durations.short = data.durations.short || durations.short;
            durations.long = data.durations.long || durations.long;
            // Update display if timer is not running
            if (!isRunning) {
                remainingTime = durations[currentMode];
                displayTime();
            }
        }

        taskHistory = data.taskHistory || [];
        notificationsEnabled = data.notificationsEnabled || false;
        autoStartBreaks = data.autoStartBreaks || false;
        autoStartPomodoros = data.autoStartPomodoros || false;
        autoCheckTasks = data.autoCheckTasks || false;
        autoSwitchTasks = data.autoSwitchTasks !== undefined ? data.autoSwitchTasks : true;
        longBreakInterval = data.longBreakInterval || 4; // Load interval

        // Bildirim butonunu güncelle
        const notificationsBtn = document.getElementById('notificationsBtn');
        if (notificationsBtn) {
            if (notificationsEnabled) {
                notificationsBtn.classList.add('enabled');
                notificationsBtn.textContent = '🔕';
            }
        }

        // Günlük hedefi güncelle
        const goalInput = document.getElementById('dailyGoal');
        if (goalInput) {
            goalInput.value = dailyGoal;
        }
    } else {
        // İlk ziyaret
        localStorage.setItem('lastVisitDate', today);
    }

    updateStatistics();
}

// Haftalık pomodoro sayısını hesapla
function calculateWeekPomodoros() {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    return pomodoroHistory.filter(p => {
        const pomodoroDate = new Date(p.timestamp);
        return pomodoroDate >= weekAgo;
    }).length;
}

// Streak koruma hatırlatıcısı
function setupStreakReminder() {
    // Sayfa yüklendiğinde kontrol et
    setTimeout(() => {
        checkStreakReminder();
    }, 3000); // 3 saniye sonra kontrol et

    // Her saat başı kontrol et
    setInterval(() => {
        checkStreakReminder();
    }, 60 * 60 * 1000); // 1 saat
}

function checkStreakReminder() {
    // Streak 0'dan büyükse ve bugün pomodoro yapılmamışsa
    if (currentStreak > 0 && todayPomodoros === 0) {
        const now = new Date();
        const hour = now.getHours();

        // Akşam 18:00-21:00 arası hatırlat
        if (hour >= 18 && hour < 21) {
            const lastStreakCheck = localStorage.getItem('lastStreakCheck');
            const today = new Date().toDateString();

            // Bugün henüz hatırlatılmamışsa
            if (lastStreakCheck !== today) {
                const message = `🔥 ${currentStreak} günlük streak'in var! Bugün bir pomodoro daha ekleyelim!`;

                if (notificationsEnabled) {
                    showNotification('Streak Devam Ediyor! 🔥', message);
                }

                // Console'a da yazdır
                console.log('🔔 ' + message);

                // Bugün hatırlatıldı olarak işaretle
                localStorage.setItem('lastStreakCheck', today);
            }
        }
    }
}

// ===== FLOATING MINI PLAYER =====
function setupFloatingMini() {
    const floatingMini = document.getElementById('floatingMini');
    const floatingToggle = document.getElementById('floatingToggle');
    const floatingClose = document.getElementById('floatingClose');
    const floatingPlayPause = document.getElementById('floatingPlayPause');

    // Floating player toggle button (ana sayfadan aç/kapa)
    const floatingBtn = document.getElementById('floatingBtn');
    let popupWindow = null;

    if (floatingBtn) {
        floatingBtn.addEventListener('click', () => {
            // Eğer popup zaten açıksa kapat
            if (popupWindow && !popupWindow.closed) {
                popupWindow.close();
                popupWindow = null;
                return;
            }

            // Yeni popup window aç
            const width = 280;
            const height = 220;
            const left = window.screen.width - width - 20;
            const top = window.screen.height - height - 80;

            popupWindow = window.open('/mini-player', 'PomodoroMini',
                `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no`);

            if (popupWindow) {
                // Popup kapanınca null yap
                const checkClosed = setInterval(() => {
                    if (popupWindow.closed) {
                        clearInterval(checkClosed);
                        popupWindow = null;
                    }
                }, 500);
            }
        });
    }

    // Floating player'ı sürükle
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    floatingMini.addEventListener('mousedown', (e) => {
        isDragging = true;
        initialX = e.clientX - (floatingMini.offsetLeft || 0);
        initialY = e.clientY - (floatingMini.offsetTop || 0);
        document.addEventListener('mousemove', dragFloating);
        document.addEventListener('mouseup', stopDragging);
    });

    function dragFloating(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            const maxX = window.innerWidth - floatingMini.offsetWidth;
            const maxY = window.innerHeight - floatingMini.offsetHeight;

            floatingMini.style.left = Math.min(Math.max(0, currentX), maxX) + 'px';
            floatingMini.style.top = Math.min(Math.max(0, currentY), maxY) + 'px';
            floatingMini.style.right = 'auto';
            floatingMini.style.bottom = 'auto';
        }
    }

    function stopDragging() {
        isDragging = false;
        document.removeEventListener('mousemove', dragFloating);
        document.removeEventListener('mouseup', stopDragging);
    }

    // Ana sayfaya git butonu
    floatingToggle.addEventListener('click', () => {
        window.focus();
        window.scrollTo(0, 0);
    });

    // Kapat butonu
    floatingClose.addEventListener('click', () => {
        floatingMini.style.display = 'none';
    });

    // Play/Pause butonu
    floatingPlayPause.addEventListener('click', () => {
        const startBtn = document.querySelector('.start-btn');
        if (startBtn) {
            startBtn.click();
        }
    });

    // Floating player'ı güncelle
    function updateFloatingMini() {
        const timeDisplay = document.getElementById('timer');
        const modeDisplay = document.getElementById('currentMode');
        const startBtn = document.querySelector('.start-btn');

        // Zamanı formatla (mm:ss)
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Ana sayfadaki floating mini
        const floatingTimeEl = document.getElementById('floatingTime');
        const floatingModeEl = document.getElementById('floatingMode');
        const floatingTitleEl = document.getElementById('floatingTitle');
        const floatingPlayPauseEl = document.getElementById('floatingPlayPause');

        if (floatingTimeEl) {
            floatingTimeEl.textContent = timeString;
        }

        if (floatingModeEl) {
            let modeText = '';
            if (currentMode === 'pomodoro') modeText = 'Pomodoro';
            else if (currentMode === 'short') modeText = 'Kısa Mola';
            else if (currentMode === 'long') modeText = 'Uzun Mola';
            floatingModeEl.textContent = modeText;
        }

        if (floatingTitleEl) {
            let modeText = '';
            if (currentMode === 'pomodoro') modeText = 'Pomodoro';
            else if (currentMode === 'short') modeText = 'Kısa Mola';
            else if (currentMode === 'long') modeText = 'Uzun Mola';
            floatingTitleEl.textContent = modeText;
        }

        if (floatingPlayPauseEl) {
            floatingPlayPauseEl.textContent = isRunning ? '⏸' : '▶';
        }

        // Popup window'daki mini player'ı güncelle
        if (popupWindow && !popupWindow.closed && popupWindow.document) {
            try {
                const popupTimeEl = popupWindow.document.getElementById('time');
                const popupModeEl = popupWindow.document.getElementById('mode');
                const popupTitleEl = popupWindow.document.getElementById('title');
                const popupPlayPauseEl = popupWindow.document.getElementById('playPause');

                if (popupTimeEl) popupTimeEl.textContent = timeString;

                if (popupModeEl) {
                    let modeText = '';
                    if (currentMode === 'pomodoro') modeText = 'Pomodoro';
                    else if (currentMode === 'short') modeText = 'Kısa Mola';
                    else if (currentMode === 'long') modeText = 'Uzun Mola';
                    popupModeEl.textContent = modeText;
                }

                if (popupTitleEl) {
                    let modeText = '';
                    if (currentMode === 'pomodoro') modeText = 'Pomodoro';
                    else if (currentMode === 'short') modeText = 'Kısa Mola';
                    else if (currentMode === 'long') modeText = 'Uzun Mola';
                    popupTitleEl.textContent = modeText;
                }

                if (popupPlayPauseEl) popupPlayPauseEl.textContent = isRunning ? '⏸' : '▶';
            } catch (e) {
                // Popup window erişim hatası
            }
        }
    }

    // Her saniye güncelle
    setInterval(updateFloatingMini, 1000);
}

// ===== GÖREV KATEGORİ FİLTRELEME =====
function setupTaskFiltering() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterTasks);
    }
}

function filterTasks() {
    const selectedCategory = document.getElementById('categoryFilter').value;
    const tasks = document.querySelectorAll('.task-item');

    tasks.forEach(task => {
        const taskCategory = task.dataset.category || 'work';
        if (selectedCategory === 'all' || taskCategory === selectedCategory) {
            task.style.display = 'block';
        } else {
            task.style.display = 'none';
        }
    });
}

// ===== GÖREV TAMAMLAMA ORANI =====
function updateTaskCompletionRate() {
    const tasks = document.querySelectorAll('.task-item');
    let completedTasks = 0;
    let totalTasks = tasks.length;

    tasks.forEach(task => {
        if (task.classList.contains('completed')) {
            completedTasks++;
        }
    });

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    console.log(`Görev tamamlama oranı: %${completionRate.toFixed(1)}`);
}

// ===== ÜRETKENLİK RAPORLARI =====
function updateProductivityReport() {
    // Saatlik pomodoro dağılımı oluştur
    const hourlyDistribution = {};

    // Son 7 günün verilerini al
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        last7Days.push(date.toDateString());
    }

    // Pomodoro geçmişini analiz et
    pomodoroHistory.forEach(entry => {
        const entryDate = new Date(entry.timestamp).toDateString();
        if (last7Days.includes(entryDate)) {
            const hour = new Date(entry.timestamp).getHours();
            hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
        }
    });

    // En verimli saatleri bul
    const mostProductiveHours = Object.entries(hourlyDistribution)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }));

    // En verimli saatleri göster
    displayMostProductiveHours(mostProductiveHours);

    // Saatlik dağılım grafiğini göster
    displayHourlyChart(hourlyDistribution);

    console.log('En verimli saatler:', mostProductiveHours);
    console.log('Saatlik dağılım:', hourlyDistribution);
}

function displayMostProductiveHours(hours) {
    const container = document.getElementById('mostProductiveHours');
    if (!container) return;

    if (hours.length === 0) {
        container.innerHTML = '<div class="hour-item"><span class="hour-time">Henüz veri yok</span><span class="hour-count">-</span></div>';
        return;
    }

    container.innerHTML = hours.map(({ hour, count }) => `
        <div class="hour-item">
            <span class="hour-time">${hour}:00 - ${hour + 1}:00</span>
            <span class="hour-count">${count} pomodoro</span>
        </div>
    `).join('');
}

function displayHourlyChart(hourlyDistribution) {
    const container = document.getElementById('hourlyChart');
    if (!container) return;

    // Tüm saatleri 0-23 arası oluştur
    const allHours = Array.from({ length: 24 }, (_, i) => i);
    const maxCount = Math.max(...Object.values(hourlyDistribution), 1);

    container.innerHTML = allHours.map(hour => {
        const count = hourlyDistribution[hour] || 0;
        const percentage = (count / maxCount) * 100;

        return `
            <div class="chart-bar">
                <span class="chart-hour">${hour.toString().padStart(2, '0')}:00</span>
                <div class="chart-fill" style="width: ${percentage}%"></div>
                <span class="chart-count">${count}</span>
            </div>
        `;
    }).join('');
}

function generateProductivityReport() {
    updateProductivityReport();
}

// ===== SES ÖNİZLEME =====
function previewSound(soundType, soundName) {
    const audio = new Audio(`/static/sounds/${soundName}.wav`);
    audio.volume = 0.5;
    audio.play().catch(err => console.warn(`${soundType} önizleme çalınamadı:`, err));

    // 2 saniye sonra durdur
    setTimeout(() => {
        audio.pause();
    }, 2000);
}

// ===== ARKA PLAN KONTROLÜ =====
function setupPageVisibility() {
    // Sayfa görünürlük değişikliklerini dinle
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Sayfa kapatılırken veri kaydet
    window.addEventListener('beforeunload', () => {
        if (isRunning) {
            saveData();
        }
    });
}

function handleVisibilityChange() {
    if (document.hidden) {
        // Sayfa arka plana alındı
        isPageVisible = false;
        if (isRunning) {
            backgroundStartTime = Date.now();
            console.log('⏸️ Sayfa arka plana alındı - Zamanlayıcı duraklatıldı');
            // Explicitly clear interval to prevent browser throttling issues
            if (timer) clearInterval(timer);
        }
    } else {
        // Sayfa tekrar aktif oldu
        isPageVisible = true;
        if (isRunning && backgroundStartTime > 0) {
            // Arka planda geçen süreyi hesapla
            backgroundDuration = Math.floor((Date.now() - backgroundStartTime) / 1000);

            // Kalan süreden arka planda geçen süreyi çıkar
            remainingTime = Math.max(0, remainingTime - backgroundDuration);

            console.log(`⏰ Sayfa tekrar aktif - Arka planda geçen süre: ${backgroundDuration}s`);
            console.log(`⏰ Kalan süre: ${remainingTime}s`);

            // Eğer süre bittiyse alarm çal
            if (remainingTime <= 0) {
                clearInterval(timer);
                isRunning = false;
                document.querySelector('.start-btn').textContent = 'START';
                tickAudio.pause();
                playAlarm();
                // Timer completion handled when page returns from background
            } else {
                // Zamanlayıcıyı yeniden başlat
                clearInterval(timer);
                timer = setInterval(timerTick, 1000);
            }

            backgroundStartTime = 0;
            backgroundDuration = 0;
        }

        // Zamanı güncelle
        displayTime();
    }
}

function timerTick() {
    // Wall-clock based timer: gerçek zamandan kalan süreyi hesapla
    if (endTimestamp > 0) {
        remainingTime = Math.max(0, Math.floor((endTimestamp - Date.now()) / 1000));
    } else {
        // Fallback: eski yöntem
        remainingTime--;
    }

    if (remainingTime <= 0) {
        clearInterval(timer);
        isRunning = false;
        endTimestamp = 0; // Timer bitti, endTimestamp'i sıfırla
        document.querySelector('.start-btn').textContent = 'START';
        tickAudio.pause();
        playAlarm();

        // Ensure effect triggers
        try {
            triggerFocusCompleteEffect();
        } catch (e) { console.error("Effect error:", e); }

        if (currentMode === 'pomodoro') {
            cycleCount++;
            todayPomodoros++;
            weekPomodoros++;

            // Analytics: Pomodoro completed
            if (window.trackEvent) {
                trackEvent('pomodoro_completed', {
                    mode: 'pomodoro',
                    duration: durations.pomodoro / 60,
                    daily_count: todayPomodoros,
                    total_count: cycleCount,
                    goal_set: currentPomodoroGoal ? 'yes' : 'no'
                });
            }

            // Pomodoro geçmişine ekle
            pomodoroHistory.push({
                timestamp: new Date().toISOString(),
                mode: 'pomodoro',
                duration: durations.pomodoro / 60 // dakika cinsinden
            });
            updateStreak();

            // --- XP & LEVELING ---
            let baseXP = 100;

            // Check Potion (Active?)
            const potionEnd = parseInt(localStorage.getItem('xp_potion_end') || '0');
            let isPotionActive = false;
            if (Date.now() < potionEnd) {
                baseXP *= 2;
                isPotionActive = true;
            }

            const oldXP = dataManager.getXP();
            const newXP = dataManager.addXP(baseXP); // Add XP
            checkLevelUp(oldXP, newXP);
            updateGamificationUI();

            // 🎉 Yeni: XP popup ve motivasyon mesajı göster
            const xpReason = isPotionActive ? "Pomodoro + 2x Potion" : "Pomodoro tamamlandı!";
            showXPGain(baseXP, xpReason);
            setTimeout(showMotivationMessage, 500);
            checkStreakMilestone(currentStreak);
            // ---------------------

            // İstatistikleri güncelle
            updateStatistics();
            saveData();
            promptCompletedNote();

            // Sync to server if logged in
            syncProgress();

            // Show session summary after 1 pomodoro or every 4 (unless disabled)
            const noAutoSummary = localStorage.getItem('noAutoSummary');
            if (!noAutoSummary && (todayPomodoros === 1 || todayPomodoros % 4 === 0)) {
                setTimeout(showSessionSummary, 1500);
            }

            // Bildirim gönder
            if (notificationsEnabled) {
                const message = todayPomodoros > 1
                    ? `Harika! Bugün ${todayPomodoros} pomodoro tamamladın! Streak: ${currentStreak} gün 🔥 (+${baseXP} XP)`
                    : `İlk pomodoron tamamlandı! Streak: ${currentStreak} gün 🔥 (+${baseXP} XP)`;
                showNotification('Pomodoro Tamamlandı! 🎉', message);
            }

            if (autoCheckTasks) {
                console.log("✅ Görev otomatik işaretlendi.");
            }

            if (autoSwitchTasks) {
                console.log("➡️ Sonraki göreve geçiliyor.");
            }

            if (autoStartBreaks) {
                const interval = parseInt(document.getElementById('longBreakInterval').value || 4);
                if (cycleCount % interval === 0) {
                    setMode('long');
                } else {
                    setMode('short');
                }
                startTimer();
            }
        } else {
            // Mola bittiği zaman bildirim gönder
            if (notificationsEnabled) {
                if (currentMode === 'short') {
                    showNotification('Kısa Mola Bitti! ⏰', 'Tekrar çalışmaya hazır mısın?');
                } else if (currentMode === 'long') {
                    showNotification('Uzun Mola Bitti! ⏰', 'Tekrar odaklanma zamanı!');
                }
            }

            if (autoStartPomodoros) {
                setMode('pomodoro');
                startTimer();
            }
        }
        return;
    }

    // Wall-clock timer handles decrement, just update display
    displayTime();

    // Tık sesi çal
    if (tickAudio && !tickAudio.paused) {
        tickAudio.currentTime = 0;
        tickAudio.play().catch(() => { });
    }

    // --- GAMIFICATION HOOK ---
    // Award 1 XP roughly every minute while focused (simple logic: every 60 ticks)
    // Only in pomodoro mode
    if (currentMode === 'pomodoro' && remainingTime % 60 === 0 && remainingTime < durations.pomodoro) {
        const oldXP = dataManager.getXP();
        const newXP = dataManager.addXP(1); // 1 XP per minute
        checkLevelUp(oldXP, newXP);
        updateGamificationUI();
        saveData();
    }
    // -------------------------
}


// Sayfa yüklendiğinde filtrelemeyi ayarla
document.addEventListener('DOMContentLoaded', () => {
    setupTaskFiltering();
});


// ===== Dropdown Logic =====
function setupDropdown() {
    const menuBtn = document.getElementById('menuBtn');
    const dropdown = document.getElementById('headerDropdown');

    if (!menuBtn || !dropdown) return;

    // Toggle
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
        menuBtn.classList.toggle('active');
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !menuBtn.contains(e.target)) {
            dropdown.classList.remove('show');
            menuBtn.classList.remove('active');
        }
    });

    // Esc to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            dropdown.classList.remove('show');
            menuBtn.classList.remove('active');
        }
    });
}

// ===== ONBOARDING SYSTEM =====
function setupOnboarding() {
    const hasSeenOnboarding = localStorage.getItem('pomodev_onboarding_done');
    if (hasSeenOnboarding) return;

    const modal = document.getElementById('onboardingModal');
    const nextBtn = document.getElementById('onboardingNext');
    const skipBtn = document.getElementById('onboardingSkip');

    if (!modal || !nextBtn || !skipBtn) return;

    let currentStep = 1;
    const totalSteps = 3;

    // Show modal after a short delay
    setTimeout(() => {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }, 1000);

    function showStep(step) {
        document.querySelectorAll('.onboarding-step').forEach(s => s.classList.add('hidden'));
        document.querySelectorAll('.onboarding-dot').forEach(d => d.classList.remove('active'));

        const stepEl = document.querySelector(`.onboarding-step[data-step="${step}"]`);
        const dotEl = document.querySelector(`.onboarding-dot[data-dot="${step}"]`);

        if (stepEl) stepEl.classList.remove('hidden');
        if (dotEl) dotEl.classList.add('active');

        if (step === totalSteps) {
            nextBtn.textContent = 'Başla! 🚀';
        } else {
            nextBtn.textContent = 'İleri →';
        }
    }

    function closeOnboarding() {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        localStorage.setItem('pomodev_onboarding_done', 'true');
    }

    nextBtn.addEventListener('click', () => {
        if (currentStep < totalSteps) {
            currentStep++;
            showStep(currentStep);
        } else {
            closeOnboarding();
        }
    });

    skipBtn.addEventListener('click', closeOnboarding);
}

// Call onboarding on page load
document.addEventListener('DOMContentLoaded', setupOnboarding);
