// Pomodoro zamanlayıcı değişkenleri
// Pomodoro zamanlayıcı değişkenleri
let timerWorker = new Worker('/static/worker.js'); // Web Worker initialization
let timer; // Kept for legacy compatibility or other uses if needed, but main loop is now worker driven

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
    long: 15 * 60,
    stopwatch: 0
};

let remainingTime = durations.pomodoro;
let endTimestamp = 0; // Wall-clock based timer için bitiş zamanı

// Kronometre: 0'dan yukarı sayar, durdurulana kadar
let stopwatchElapsed = 0;   // Birikmiş saniye (pause'larda)
let stopwatchStartTime = 0; // Başlangıç zamanı (çalışırken)

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

// Tema ve Analitik - hemen tanımla (onclick çalışsın diye)
window.toggleTheme = function () {
    const root = document.documentElement;
    if (!root) return;
    const themeToggle = document.getElementById('themeToggle');
    const settingsThemeToggle = document.getElementById('settingsThemeToggle');
    const current = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', current);
    localStorage.setItem('theme', current);
    if (themeToggle) themeToggle.textContent = current === 'light' ? '☀️' : '🌙';
    if (settingsThemeToggle) settingsThemeToggle.textContent = current === 'light' ? '☀️ Değiştir' : '🌙 Değiştir';
};
window.openAnalyticsModal = function () {
    document.getElementById('headerDropdown')?.classList.remove('show');
    if (window._analyticsManager) {
        window._analyticsManager.open();
        return;
    }
    var m = document.getElementById('analyticsModal');
    if (m) {
        m.classList.remove('hidden');
        m.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        if (!localStorage.getItem('auth_token')) {
            setTimeout(function () { alert('Lütfen önce giriş yapın.'); }, 50);
        }
    }
};

// Event delegation - capture fazında (önce biz yakalayalım)
document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-action="open-analytics"], .open-analytics-btn');
    if (btn) {
        e.preventDefault();
        e.stopPropagation();
        window.openAnalyticsModal();
        return;
    }
    const themeBtn = e.target.closest('[data-action="toggle-theme"], #themeToggle, #settingsThemeToggle');
    if (themeBtn) {
        e.preventDefault();
        e.stopPropagation();
        window.toggleTheme();
        return;
    }
    const notifBtn = e.target.closest('#notificationsBtn');
    if (notifBtn) {
        e.preventDefault();
        e.stopPropagation();
        handleNotificationsToggle(notifBtn);
    }
}, true);

// ===== SECURITY: XSS Prevention =====
// Sanitize user input to prevent XSS attacks
function sanitizeHTML(str) {
    if (str === null || str === undefined) return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// Create text node safely (preferred method)
function createSafeTextNode(text) {
    return document.createTextNode(text || '');
}

// ===== INPUT VALIDATION =====
const InputValidator = {
    // Validate task text
    taskText(text) {
        if (!text || typeof text !== 'string') return { valid: false, error: 'Görev metni gerekli' };
        text = text.trim();
        if (text.length < 1) return { valid: false, error: 'Görev metni boş olamaz' };
        if (text.length > 500) return { valid: false, error: 'Görev metni çok uzun (max 500 karakter)' };
        return { valid: true, value: text };
    },

    // Validate note content
    noteContent(content) {
        if (!content || typeof content !== 'string') return { valid: false, error: 'Not içeriği gerekli' };
        content = content.trim();
        if (content.length < 1) return { valid: false, error: 'Not içeriği boş olamaz' };
        if (content.length > 2000) return { valid: false, error: 'Not içeriği çok uzun (max 2000 karakter)' };
        return { valid: true, value: content };
    },

    // Validate username
    username(name) {
        if (!name || typeof name !== 'string') return { valid: false, error: 'Kullanıcı adı gerekli' };
        name = name.trim();
        if (name.length < 3) return { valid: false, error: 'Kullanıcı adı en az 3 karakter olmalı' };
        if (name.length > 30) return { valid: false, error: 'Kullanıcı adı en fazla 30 karakter olmalı' };
        if (!/^[a-zA-Z0-9_]+$/.test(name)) return { valid: false, error: 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir' };
        return { valid: true, value: name };
    },

    // Validate password
    password(pass) {
        if (!pass || typeof pass !== 'string') return { valid: false, error: 'Şifre gerekli' };
        if (pass.length < 6) return { valid: false, error: 'Şifre en az 6 karakter olmalı' };
        if (pass.length > 128) return { valid: false, error: 'Şifre çok uzun' };
        return { valid: true, value: pass };
    },

    // Validate integer
    integer(value, min = null, max = null) {
        const num = parseInt(value);
        if (isNaN(num)) return { valid: false, error: 'Geçerli bir sayı girin' };
        if (min !== null && num < min) return { valid: false, error: `Minimum değer: ${min}` };
        if (max !== null && num > max) return { valid: false, error: `Maximum değer: ${max}` };
        return { valid: true, value: num };
    },

    // Validate time (minutes)
    timerMinutes(value) {
        return this.integer(value, 1, 120);
    }
};

// Make validator globally available
window.InputValidator = InputValidator;

// ===== MEMORY MANAGEMENT: Interval Tracking =====
const intervalRegistry = new Set();
const timeoutRegistry = new Set();

function registerInterval(id) {
    intervalRegistry.add(id);
    return id;
}

function registerTimeout(id) {
    timeoutRegistry.add(id);
    return id;
}

function clearRegisteredInterval(id) {
    clearInterval(id);
    intervalRegistry.delete(id);
}

function clearRegisteredTimeout(id) {
    clearTimeout(id);
    timeoutRegistry.delete(id);
}

function clearAllIntervals() {
    intervalRegistry.forEach(id => clearInterval(id));
    intervalRegistry.clear();
}

function clearAllTimeouts() {
    timeoutRegistry.forEach(id => clearTimeout(id));
    timeoutRegistry.clear();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    clearAllIntervals();
    clearAllTimeouts();
});

// Cleanup on visibility change (for mobile)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, could pause non-essential intervals
    }
});

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
            // Cloud Sync is handled by syncProgress() call in saveData() or specific events
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
    // İlk olarak timer state'ini ayarla
    if (currentMode === 'stopwatch') {
        stopwatchElapsed = 0;
        stopwatchStartTime = 0;
        endTimestamp = 0;
    }
    
    // iOS Safari için KRİTİK: Sayfa yüklendiğinde timer state'i mutlaka restore et
    setTimeout(() => {
        restoreTimerStateFromStorage();
    }, 200); else {
        remainingTime = durations[currentMode];
        endTimestamp = 0;
    }
    isRunning = false;

    // Timer'ı temizle (güvenlik için)
    if (timer) {
        clearInterval(timer);
        timer = null;
    }

    // UI'ı güncelle
    displayTime();
    updateFocusMessage();
    updateModeStyles();

    // Start butonunu kontrol et
    const startBtn = document.querySelector('.start-btn');
    if (startBtn) {
        startBtn.textContent = 'START';
    }

    // Diğer setup'ları yap
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
    // ===== Sound Mixer Logic =====
    class SoundMixer {
        constructor() {
            this.tracks = {};
            this.sounds = {
                'rain': '/static/sounds/rain.mp3',
                'cafe': '/static/sounds/cafe.mp3',
                'forest': '/static/sounds/forest.mp3',
                'fire': '/static/sounds/fire.mp3'
            };
            this.init();
        }

        init() {
            // Initialize Audio objects for each sound
            for (const [key, url] of Object.entries(this.sounds)) {
                const audio = new Audio(url);
                audio.loop = true;
                audio.volume = 0; // Start muted
                this.tracks[key] = audio;
            }

            // Restore saved volumes
            this.loadMix();
        }

        setVolume(trackKey, volume) {
            if (!this.tracks[trackKey]) return;

            const vol = volume / 100;
            this.tracks[trackKey].volume = vol;

            // Auto play/pause based on volume
            if (vol > 0 && this.tracks[trackKey].paused) {
                this.tracks[trackKey].play().catch(e => console.log('Audio autoplay prevented:', e));
            } else if (vol === 0 && !this.tracks[trackKey].paused) {
                this.tracks[trackKey].pause();
            }

            // Update UI Icon
            const icon = document.querySelector(`.track-icon[onclick="toggleSound('${trackKey}')"]`);
            if (icon) {
                if (vol > 0) icon.classList.add('active');
                else icon.classList.remove('active');
            }

            // Save mix state
            this.saveMix();
        }

        toggleSound(trackKey) {
            const slider = document.querySelector(`input[oninput="setVolume('${trackKey}', this.value)"]`);
            if (!slider) return;

            // If playing (vol > 0), mute it. If muted, set to 50%
            if (slider.value > 0) {
                slider.value = 0;
            } else {
                slider.value = 50;
            }
            // Trigger input event manually to update volume
            this.setVolume(trackKey, slider.value);
        }

        saveMix() {
            const mix = {};
            for (const key of Object.keys(this.tracks)) {
                const slider = document.querySelector(`input[oninput="setVolume('${key}', this.value)"]`);
                if (slider) mix[key] = slider.value;
            }
            localStorage.setItem('pomodev_sound_mix', JSON.stringify(mix));
        }

        loadMix() {
            const saved = localStorage.getItem('pomodev_sound_mix');
            if (saved) {
                try {
                    const mix = JSON.parse(saved);
                    for (const [key, val] of Object.entries(mix)) {
                        const slider = document.querySelector(`input[oninput="setVolume('${key}', this.value)"]`);
                        if (slider) {
                            slider.value = val;
                            this.setVolume(key, val);
                        }
                    }
                } catch (e) {
                    console.error('Failed to load sound mix', e);
                }
            }
        }
    }

    // Global instance
    let soundMixer;

    // Expose mix functions globally for HTML onclick events
    window.setVolume = (track, val) => soundMixer?.setVolume(track, val);
    window.toggleSound = (track) => soundMixer?.toggleSound(track);

    soundMixer = new SoundMixer(); // Init Sound Mixer
    loadData().then(() => {
        updateGamificationUI();
        loadTasks();
        setupBrainDump(); // New
        loadNotes();      // New
        updateTimeline(); // New
        // iOS Safari için KRİTİK: Sayfa yüklendiğinde timer state'i mutlaka restore et
        setTimeout(() => {
            restoreTimerStateFromStorage();
        }, 300);
        window.PomodoroVisualCounter?.render(); // Sync visual counter
    });
    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
    setupHowItWorks();

    // Boş durum butonları: event delegation (inline onclick yerine)
    document.body.addEventListener('click', function emptyStateClick(e) {
        var btn = e.target.closest('.empty-action-btn[data-empty-action]');
        if (!btn) return;
        var action = btn.getAttribute('data-empty-action');
        if (action === 'add-task') {
            e.preventDefault();
            addTask();
        } else if (action === 'focus-note-input') {
            e.preventDefault();
            document.getElementById('noteInput')?.focus();
        } else if (action === 'start-timer') {
            e.preventDefault();
            document.querySelector('.start-btn')?.click();
        }
    });

    // Init Analytics
    window._analyticsManager = new AnalyticsManager();

    // Listen for Worker messages
    timerWorker.onmessage = function (e) {
        if (e.data && e.data.action === 'TICK') {
            timerTick();
        }
    };
});

// ===== ANALYTICS MANAGER =====
class AnalyticsManager {
    constructor() {
        this.btns = document.querySelectorAll('.open-analytics-btn');
        this.modal = document.getElementById('analyticsModal');
        this.closeBtn = document.getElementById('closeAnalytics');
        this.charts = {}; // Store chart instances

        this.init();
    }

    init() {
        /* open-analytics-btn tıklamaları: document event delegation ile yönetiliyor */

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.close();
            }
        });
    }

    open() {
        if (!this.modal) return;
        this.modal.classList.remove('hidden');
        this.modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        this.fetchAndRender();
    }

    close() {
        if (!this.modal) return;
        this.modal.classList.add('hidden');
        this.modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    async fetchAndRender() {
        const token = localStorage.getItem('auth_token');

        if (!token) {
            alert("Lütfen önce giriş yapın.");
            return;
        }

        try {
            const res = await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ token: token })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Veri alınamadı");
            }

            const responseData = await res.json();
            // Handle standardized response format
            const data = responseData.success ? responseData.data : responseData;

            this.updateStats(data);
            this.renderCharts(data);

        } catch (e) {
            console.error("Analytics Error:", e);
            alert("Analitik veriler yüklenirken bir hata oluştu: " + e.message);
        }
    }

    updateStats(data) {
        if (!data) {
            console.warn('Analytics data is empty');
            return;
        }

        const totalTimeEl = document.getElementById('dashTotalTime');
        const weeklyCountEl = document.getElementById('dashWeeklyCount');

        if (totalTimeEl) {
            totalTimeEl.textContent = (data.total_focus_hours || 0) + 'h';
        }

        // Calculate weekly count
        let weeklyCount = 0;
        if (data.weekly_activity && typeof data.weekly_activity === 'object') {
            for (let count of Object.values(data.weekly_activity)) {
                weeklyCount += parseInt(count) || 0;
            }
        }

        if (weeklyCountEl) {
            weeklyCountEl.textContent = weeklyCount;
        }

        // Simple score logic
        let score = 'C';
        if (weeklyCount > 20) score = 'A+';
        else if (weeklyCount > 10) score = 'B';
        else if (weeklyCount > 5) score = 'C+';
        document.getElementById('dashScore').textContent = score;
    }

    renderCharts(data) {
        if (!data) {
            console.warn('No data for charts');
            return;
        }

        // 1. Weekly Activity Chart
        const ctxWeekly = document.getElementById('weeklyChart');
        if (!ctxWeekly) {
            console.warn('Weekly chart canvas not found');
            return;
        }

        if (this.charts.weekly) this.charts.weekly.destroy();

        // Prepare data labels (last 7 days logic could be improved to ensure continuity)
        const weeklyActivity = data.weekly_activity || {};
        const labels = Object.keys(weeklyActivity).sort();
        const values = labels.map(key => parseInt(weeklyActivity[key]) || 0);

        this.charts.weekly = new Chart(ctxWeekly, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Pomodoros',
                    data: values,
                    backgroundColor: 'rgba(77, 163, 255, 0.6)',
                    borderColor: 'rgba(77, 163, 255, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
                    x: { grid: { display: false } }
                }
            }
        });

        // 2. Mode Distribution Chart
        const ctxMode = document.getElementById('modeChart');
        if (this.charts.mode) this.charts.mode.destroy();

        const modeDistribution = data.mode_distribution || {};
        const modeLabels = Object.keys(modeDistribution);
        const modeValues = Object.values(modeDistribution).map(v => parseInt(v) || 0);

        this.charts.mode = new Chart(ctxMode, {
            type: 'doughnut',
            data: {
                labels: modeLabels,
                datasets: [{
                    data: modeValues,
                    backgroundColor: ['#4da3ff', '#a78bfa', '#fb7185'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
}

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
    for (let i = 0; i < 40; i++) {
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
    const token = localStorage.getItem('auth_token');
    if (!token) return; // Not logged in

    try {
        const xp = dataManager.getXP();
        const level = gameManager.getLevel(xp);

        // Gather ALL user data
        const inventory = localStorage.getItem('pomodev_inventory') || '[]';
        const stats = localStorage.getItem('pomodevData') || '{}';
        const tasks = localStorage.getItem('pomodev_tasks') || '[]';

        // Tüm ayarlar (süreler, otomatik başlatma, ses, tema vb.)
        const settings = JSON.stringify({
            theme: localStorage.getItem('theme') || 'dark',
            accent: localStorage.getItem('accent') || 'blue',
            pomodev_active_theme: localStorage.getItem('pomodev_active_theme') || 'default',
            pomodev_active_effect: localStorage.getItem('pomodev_active_effect') || 'confetti',
            durations: durations,
            autoStartBreaks: autoStartBreaks,
            autoStartPomodoros: autoStartPomodoros,
            autoCheckTasks: autoCheckTasks,
            autoSwitchTasks: autoSwitchTasks,
            longBreakInterval: longBreakInterval,
            notificationsEnabled: notificationsEnabled,
            alarmSound: document.getElementById('alarmSound')?.value || 'kitchen',
            alarmRepeat: parseInt(document.getElementById('alarmRepeat')?.value || 1),
            alarmVolume: parseInt(document.getElementById('alarmVolume')?.value || 50),
            tickSound: document.getElementById('tickSound')?.value || 'none',
            tickVolume: parseInt(document.getElementById('tickVolume')?.value || 50)
        });

        const response = await fetch('/api/save_user_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                token: token,
                xp: xp,
                level: level,
                inventory: inventory,
                stats: stats,
                settings: settings,
                tasks: tasks
            })
        });

        if (response.ok) {
            console.log('✅ All user data synced to cloud');
        } else {
            const data = await response.json();
            console.warn('Failed to sync user data:', data.error || 'Unknown error');
        }
    } catch (err) {
        console.error('Failed to sync user data:', err);
    }
}

async function syncSession(mode, duration) {
    const token = localStorage.getItem('auth_token');
    if (!token) return; // Not logged in

    try {
        const response = await fetch('/api/sync_session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                token: token,
                mode: mode,
                duration: duration
            })
        });

        if (response.ok) {
            console.log('✅ Session synced to cloud');
        } else {
            const data = await response.json();
            console.warn('Failed to sync session:', data.error || 'Unknown error');
        }
    } catch (err) {
        console.error('Failed to sync session:', err);
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
    const timerElement = document.getElementById('timer');
    if (!timerElement) {
        console.warn('Timer element not found!');
        return;
    }

    // Kronometre modu: 0'dan yukarı say (mm:ss veya hh:mm:ss)
    if (currentMode === 'stopwatch') {
        let elapsed = stopwatchElapsed;
        if (isRunning && stopwatchStartTime > 0) {
            elapsed += Math.floor((Date.now() - stopwatchStartTime) / 1000);
        }
        const h = Math.floor(elapsed / 3600);
        const m = Math.floor((elapsed % 3600) / 60);
        const s = elapsed % 60;
        const mm = m.toString().padStart(2, '0');
        const ss = s.toString().padStart(2, '0');
        timerElement.textContent = h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
        return;
    }

    // remainingTime'in geçerli olduğundan emin ol
    if (isNaN(remainingTime) || remainingTime < 0) {
        remainingTime = durations[currentMode] || 1500; // Default 25 dakika
    }

    const minutes = Math.floor(remainingTime / 60).toString().padStart(2, '0');
    const seconds = (remainingTime % 60).toString().padStart(2, '0');
    timerElement.textContent = `${minutes}:${seconds}`;

    // Timer mode'u güncelle
    const modeText = document.getElementById('focusMsg');
    if (modeText) {
        if (currentMode === 'pomodoro') {
            modeText.innerHTML = `#${cycleCount + 1}<br />Time to focus!`;
        } else if (currentMode === 'short') {
            modeText.innerHTML = `Short Break<br />Take a rest!`;
        } else if (currentMode === 'long') {
            modeText.innerHTML = `Long Break<br />Relax & recharge!`;
        } else if (currentMode === 'stopwatch') {
            modeText.innerHTML = `Kronometre<br />Durdurana kadar sayar`;
        }
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

// Tema rengi isimleri
const ACCENT_LABELS = { blue: 'Mavi', purple: 'Mor', coral: 'Mercan', red: 'Kırmızı', green: 'Yeşil', teal: 'Turkuaz', orange: 'Turuncu', amber: 'Amber', pink: 'Pembe' };

const ACCENT_VARS = {
    blue: { primary: '#4da3ff', primaryStrong: '#2a7be7', primaryRgb: '77, 163, 255' },
    purple: { primary: '#a78bfa', primaryStrong: '#7c3aed', primaryRgb: '167, 139, 250' },
    coral: { primary: '#fb7185', primaryStrong: '#e11d48', primaryRgb: '251, 113, 133' },
    red: { primary: '#ef4444', primaryStrong: '#dc2626', primaryRgb: '239, 68, 68' },
    green: { primary: '#22c55e', primaryStrong: '#16a34a', primaryRgb: '34, 197, 94' },
    teal: { primary: '#14b8a6', primaryStrong: '#0d9488', primaryRgb: '20, 184, 166' },
    orange: { primary: '#f97316', primaryStrong: '#ea580c', primaryRgb: '249, 115, 22' },
    amber: { primary: '#f59e0b', primaryStrong: '#d97706', primaryRgb: '245, 158, 11' },
    pink: { primary: '#ec4899', primaryStrong: '#db2777', primaryRgb: '236, 72, 153' }
};

// Dropdown toggle - HTML onclick'ten çağrılır
function toggleAccentDropdown(e) {
    if (e) e.stopPropagation();
    const btn = document.getElementById('accentDropdownBtn');
    const menu = document.getElementById('accentDropdownMenu');
    if (!btn || !menu) return;
    const isOpen = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
    menu.setAttribute('aria-hidden', !isOpen);
}

// Ayarlar dropdown toggle
function toggleSettingsAccentDropdown(e) {
    if (e) e.stopPropagation();
    const btn = document.getElementById('settingsAccentDropdownBtn');
    const menu = document.getElementById('settingsAccentDropdown');
    if (!btn || !menu) return;
    const isOpen = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
    menu.setAttribute('aria-hidden', !isOpen);
    const hmenu = document.getElementById('accentDropdownMenu');
    if (hmenu) { hmenu.classList.remove('open'); hmenu.setAttribute('aria-hidden', 'true'); }
}

// Renk seç - HTML onclick'ten çağrılır
function selectAccent(value, e) {
    if (e) e.stopPropagation();
    if (typeof applyAccent === 'function') applyAccent(value);
    const menu = document.getElementById('accentDropdownMenu');
    const smenu = document.getElementById('settingsAccentDropdown');
    if (menu) { menu.classList.remove('open'); menu.setAttribute('aria-hidden', 'true'); }
    if (smenu) { smenu.classList.remove('open'); smenu.setAttribute('aria-hidden', 'true'); }
    const btn = document.getElementById('accentDropdownBtn');
    const sbtn = document.getElementById('settingsAccentDropdownBtn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    if (sbtn) sbtn.setAttribute('aria-expanded', 'false');
}

// Renk seçildiğinde sayfa rengini güncelle - JS ile doğrudan uygula
function applyAccent(value) {
    const root = document.documentElement;
    root.setAttribute('data-accent', value);
    localStorage.setItem('accent', value);
    // Renkleri doğrudan CSS değişkeni olarak uygula (önbellek/shop uyumsuzluğu önlenir)
    const vars = ACCENT_VARS[value] || ACCENT_VARS.blue;
    root.style.setProperty('--primary', vars.primary);
    root.style.setProperty('--primary-strong', vars.primaryStrong);
    root.style.setProperty('--primary-rgb', vars.primaryRgb);
    updateAccentDropdownUI(value);
}

function updateAccentDropdownUI(accent) {
    const label = ACCENT_LABELS[accent] || 'Mavi';
    const headerLabel = document.getElementById('accentDropdownLabel');
    const headerBtn = document.getElementById('accentDropdownBtn');
    const settingsLabel = document.getElementById('settingsAccentLabel');
    const settingsBtn = document.getElementById('settingsAccentDropdownBtn');
    if (headerLabel) headerLabel.textContent = label;
    if (settingsLabel) settingsLabel.textContent = label;
    // Seçili rengi butonda göster
    [headerBtn, settingsBtn].forEach(btn => {
        if (!btn) return;
        const dot = btn.querySelector('.accent-dot');
        if (dot) {
            dot.className = 'accent-dot accent-dot-' + accent;
        }
    });
    document.querySelectorAll('.accent-option').forEach(opt => {
        opt.setAttribute('aria-selected', opt.getAttribute('data-accent') === accent ? 'true' : 'false');
    });
}

// Tema ve accent kontrolü
function setupThemeControls() {
    const root = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    const accentDropdownBtn = document.getElementById('accentDropdownBtn');
    const accentDropdownMenu = document.getElementById('accentDropdownMenu');
    const settingsAccentBtn = document.getElementById('settingsAccentDropdownBtn');
    const settingsAccentMenu = document.getElementById('settingsAccentDropdown');

    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedAccent = localStorage.getItem('accent') || 'blue';
    root.setAttribute('data-theme', savedTheme);
    applyAccent(savedAccent);
    if (themeToggle) themeToggle.textContent = savedTheme === 'light' ? '☀️' : '🌙';
    /* Tema değişimi: window.toggleTheme + document event delegation ile yapılıyor */

    function closeAllAccentDropdowns() {
        if (accentDropdownMenu) { accentDropdownMenu.classList.remove('open'); accentDropdownMenu.setAttribute('aria-hidden', 'true'); }
        if (accentDropdownBtn) accentDropdownBtn.setAttribute('aria-expanded', 'false');
        if (settingsAccentMenu) { settingsAccentMenu.classList.remove('open'); settingsAccentMenu.setAttribute('aria-hidden', 'true'); }
        if (settingsAccentBtn) settingsAccentBtn.setAttribute('aria-expanded', 'false');
    }

    if (accentDropdownBtn && accentDropdownMenu) {
        accentDropdownBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = accentDropdownMenu.classList.toggle('open');
            accentDropdownBtn.setAttribute('aria-expanded', isOpen);
            accentDropdownMenu.setAttribute('aria-hidden', !isOpen);
            if (settingsAccentMenu) settingsAccentMenu.classList.remove('open');
        });
    }

    if (settingsAccentBtn && settingsAccentMenu) {
        settingsAccentBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = settingsAccentMenu.classList.toggle('open');
            settingsAccentBtn.setAttribute('aria-expanded', isOpen);
            settingsAccentMenu.setAttribute('aria-hidden', !isOpen);
            if (accentDropdownMenu) accentDropdownMenu.classList.remove('open');
        });
    }

    document.querySelectorAll('.accent-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const value = opt.getAttribute('data-accent');
            applyAccent(value);
            closeAllAccentDropdowns();
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.accent-dropdown-container') && !e.target.closest('.accent-select-wrapper')) {
            closeAllAccentDropdowns();
        }
    });
}

function startTimer() {
    const startBtn = document.querySelector('.start-btn');

    if (!startBtn) {
        console.error('Start button not found!');
        return;
    }

    if (isRunning) {
        // PAUSE
        // Worker'ı durdur
        try {
            if (timerWorker) {
                timerWorker.postMessage({ action: 'PAUSE' });
            }
        } catch (e) {}
        // Timer'ı durdur
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
        // iOS save interval'ı temizle
        if (window._iosSaveInterval) {
            clearInterval(window._iosSaveInterval);
            window._iosSaveInterval = null;
        }
        isRunning = false;
        startBtn.textContent = 'START';
        tickAudio.pause();

        // Kronometre: birikmiş süreyi güncelle
        if (currentMode === 'stopwatch' && stopwatchStartTime > 0) {
            stopwatchElapsed += Math.floor((Date.now() - stopwatchStartTime) / 1000);
            stopwatchStartTime = 0;
            displayTime();
            return;
        }

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

        // PAUSE durumunu kaydet
        saveData();
        return;
    }

    // START
    // Kronometre: hedef sorma, doğrudan başlat
    if (currentMode === 'stopwatch') {
        actuallyStartTimer();
        return;
    }

    // Eğer timer sıfırlanmışsa veya başlangıç durumundaysa
    if (remainingTime <= 0 || remainingTime >= durations[currentMode]) {
        remainingTime = durations[currentMode];
    }

    // Yeni pomodoro başlangıcında hedef sor (sadece pomodoro modunda ve tam süre varsa)
    const goalModal = document.getElementById('goalModal');
    if (currentMode === 'pomodoro' && remainingTime === durations.pomodoro && goalModal) {
        promptGoalBeforeStart();
        return; // Modal kapanınca actuallyStartTimer() çağrılacak
    }

    // Normal başlatma (mola sonrası devam veya pomodoro bitmişse)
    actuallyStartTimer();
}

function resetTimer() {
    // Worker'ı durdur
    try {
        if (timerWorker) {
            timerWorker.postMessage({ action: 'STOP' });
        }
    } catch (e) {}
    // Timer'ı durdur
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    // iOS save interval'ı temizle
    if (window._iosSaveInterval) {
        clearInterval(window._iosSaveInterval);
        window._iosSaveInterval = null;
    }
    isRunning = false;
    if (currentMode === 'stopwatch') {
        stopwatchElapsed = 0;
        stopwatchStartTime = 0;
    } else {
        remainingTime = durations[currentMode];
    }
    endTimestamp = 0; // endTimestamp'i sıfırla

    const startBtn = document.querySelector('.start-btn');
    if (startBtn) {
        startBtn.textContent = 'START';
    }

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

    // Zamanı göster
    displayTime();

    // Resetlenen durumu kaydet (temizle)
    saveData();
}

function setMode(mode) {
    // Önce timer'ı durdur
    if (isRunning) {
        // Worker'ı durdur
        try {
            if (timerWorker) {
                timerWorker.postMessage({ action: 'PAUSE' });
            }
        } catch (e) {}
        // Timer'ı durdur
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
        // iOS save interval'ı temizle
        if (window._iosSaveInterval) {
            clearInterval(window._iosSaveInterval);
            window._iosSaveInterval = null;
        }
        isRunning = false;
        document.querySelector('.start-btn').textContent = 'START';
        tickAudio.pause();
        if (currentMode === 'stopwatch' && stopwatchStartTime > 0) {
            stopwatchElapsed += Math.floor((Date.now() - stopwatchStartTime) / 1000);
            stopwatchStartTime = 0;
        }
    }

    currentMode = mode;
    if (mode === 'stopwatch') {
        stopwatchElapsed = 0;
        stopwatchStartTime = 0;
        endTimestamp = 0;
    } else {
        remainingTime = durations[mode];
        endTimestamp = 0;
    }
    displayTime();
    updateFocusMessage();
    updateModeStyles();
}

function updateModeStyles() {
    document.querySelectorAll('.mode').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-mode') === currentMode) {
            btn.classList.add('active');
        }
    });
}

function updateFocusMessage() {
    const msgBox = document.getElementById("focusMsg");
    if (!msgBox) return;

    const modeNameEl = document.getElementById('currentMode');
    if (modeNameEl) {
        if (currentMode === 'pomodoro') modeNameEl.textContent = 'Pomodoro';
        else if (currentMode === 'short') modeNameEl.textContent = 'Kısa Mola';
        else if (currentMode === 'long') modeNameEl.textContent = 'Uzun Mola';
        else if (currentMode === 'stopwatch') modeNameEl.textContent = 'Kronometre';
        else modeNameEl.textContent = 'Pomodoro';
    }

    switch (currentMode) {
        case 'pomodoro':
            msgBox.innerHTML = `#${cycleCount + 1}<br>Time to focus!`;
            break;
        case 'short':
            msgBox.innerHTML = "Take a short break!";
            break;
        case 'long':
            msgBox.innerHTML = "Enjoy a long break!";
            break;
        case 'stopwatch':
            msgBox.innerHTML = "Kronometre<br>Durdurana kadar sayar";
            break;
        default:
            msgBox.innerHTML = "Time to focus!";
    }
}

// Helper to bind the main start button - sadece addEventListener (çift tetiklemeyi önler)
function setupTimerControls() {
    const startBtn = document.getElementById('startPauseBtn') || document.querySelector('.start-btn');
    if (startBtn) {
        startBtn.onclick = null;
        startBtn.removeEventListener('click', startTimer);
        startBtn.addEventListener('click', startTimer);
    }
}

// ===== HEDEF & NOTLAR =====
let currentPomodoroGoal = '';
function setupGoalNotesInit() {
    const modal = document.getElementById('goalModal');
    const input = document.getElementById('goalInput');
    const saveBtn = document.getElementById('goalSaveBtn');
    const cancelBtn = document.getElementById('goalCancelBtn');
    const startWithoutGoalBtn = document.getElementById('startWithoutGoalBtn');

    if (!modal || !input || !saveBtn || !cancelBtn) {
        console.error("Critical UI missing:", { modal, input, saveBtn, cancelBtn });
        return;
    }
    console.log("setupGoalNotesInit initialized successfully");

    // Event Delegation for Start Without Goal to ensure it works dynamically
    document.body.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'startWithoutGoalBtn') {
            e.preventDefault();
            e.stopPropagation();
            console.log("Hedefsiz Başla clicked via Delegation");

            currentPomodoroGoal = null;
            const display = document.getElementById('currentGoalDisplay');
            if (display) {
                display.innerHTML = '<span style="opacity: 0.5; font-style: italic;">Hedefsiz oturum</span>';
                const goalContainer = document.querySelector('.goal-container');
                if (goalContainer) goalContainer.classList.remove('has-goal');
            }

            closeGoalModal();
            requestAnimationFrame(() => actuallyStartTimer());
        }
    });

    cancelBtn.addEventListener('click', () => {
        closeGoalModal();
        // Cancel'da timer başlatma
    });
    saveBtn.addEventListener('click', () => {
        currentPomodoroGoal = (input.value || '').trim();
        closeGoalModal();
        requestAnimationFrame(() => actuallyStartTimer());
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            currentPomodoroGoal = (input.value || '').trim();
            closeGoalModal();
            requestAnimationFrame(() => actuallyStartTimer());
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            closeGoalModal();
        }
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeGoalModal();
            // Dışarı tıklamada timer başlatma
        }
    });
}
function openGoalModal() {
    const modal = document.getElementById('goalModal');
    if (!modal) {
        console.warn('Goal modal not found, starting timer without goal');
        actuallyStartTimer();
        return;
    }
    const input = document.getElementById('goalInput');
    if (!input) {
        console.warn('Goal input not found, starting timer without goal');
        actuallyStartTimer();
        return;
    }
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    input.value = currentPomodoroGoal || '';
    setTimeout(() => input.focus(), 100);
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
    if (timer) {
        clearInterval(timer);
        timer = null;
    }

    // Eğer süre sıfırlanmışsa veya geçersizse, baştan başlat
    if (remainingTime <= 0 || remainingTime > durations[currentMode]) {
        remainingTime = durations[currentMode];
    }

    isRunning = true;
    const startBtn = document.querySelector('.start-btn');
    if (startBtn) {
        startBtn.textContent = 'PAUSE';
    }

    // iOS Safari için kritik: Worker'ı tamamen kaldırıp sadece setInterval kullan
    // Worker iOS Safari'de öldürülebilir, bu yüzden setInterval daha güvenilir
    if (!timer) {
        timer = setInterval(() => {
            if (isRunning) {
                timerTick();
            }
        }, 100); // 100ms interval ile daha hassas güncelleme
    }

    // Worker'ı da başlat (UI güncellemesi için, ama asıl zaman hesaplaması endTimestamp'ten)
    try {
        if (timerWorker) {
            timerWorker.postMessage({ action: 'START' });
        }
    } catch (e) {
        console.warn('Worker başlatılamadı, setInterval kullanılacak:', e);
    }

    updateTickSound();

    // Zen Mode Check
    if (localStorage.getItem('pomodev_active_effect') === 'zen') {
        document.body.classList.add('zen-mode');
    }

    // Kronometre: 0'dan yukarı say, bitiş yok
    if (currentMode === 'stopwatch') {
        // Eğer restore edilmediyse (0 ise) yeni başlat. Restore edildiyse elleme.
        if (stopwatchStartTime === 0) {
            stopwatchStartTime = Date.now();
        }
        endTimestamp = 0;

        displayTime();
        if (window.trackEvent) {
            trackEvent('timer_started', { mode: 'stopwatch' });
        }

        // Critical: Save state immediately for Stopwatch
        saveData();
        return;
    }

    // Wall-clock based timer: bitiş zamanını hesapla (milisaniye hassasiyeti)
    // iOS Safari için kritik: endTimestamp her zaman kaydedilmeli
    endTimestamp = Date.now() + remainingTime * 1000;

    // İlk gösterimi hemen yap
    displayTime();

    // Hedefi göster
    const goalDisplay = document.getElementById('currentGoalDisplay');
    if (goalDisplay && currentPomodoroGoal) {
        goalDisplay.textContent = `🎯 ${currentPomodoroGoal}`;
    }

    // Analytics: Timer started
    if (window.trackEvent) {
        trackEvent('timer_started', {
            mode: currentMode,
            duration: durations[currentMode],
            remaining_time: remainingTime
        });
    }

    // Başlar başlamaz durumu kaydet (iOS Safari için kritik)
    saveData();
    
    // iOS Safari için: Her saniye localStorage'a kaydet (arka plana geçince kaybolmasın)
    if (typeof window !== 'undefined' && window.navigator && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
        if (window._iosSaveInterval) {
            clearInterval(window._iosSaveInterval);
        }
        window._iosSaveInterval = setInterval(() => {
            if (isRunning) {
                saveData();
            }
        }, 1000); // Her saniye kaydet
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
let titleRemainingInterval = null;
function setupTitleRemaining() {
    const baseTitle = document.title;
    let lastState = ''; // 'timer' or 'base'

    // Clear existing interval if any
    if (titleRemainingInterval) {
        clearRegisteredInterval(titleRemainingInterval);
    }

    titleRemainingInterval = registerInterval(setInterval(() => {
        // Show timer in title ONLY when page is hidden and timer is running
        const shouldShowTimer = document.hidden && isRunning;

        if (shouldShowTimer) {
            let timeStr;
            if (currentMode === 'stopwatch') {
                let elapsed = stopwatchElapsed + (stopwatchStartTime > 0 ? Math.floor((Date.now() - stopwatchStartTime) / 1000) : 0);
                const h = Math.floor(elapsed / 3600);
                const m = Math.floor((elapsed % 3600) / 60);
                const s = elapsed % 60;
                timeStr = h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            } else {
                const m = Math.floor(remainingTime / 60).toString().padStart(2, '0');
                const s = (remainingTime % 60).toString().padStart(2, '0');
                timeStr = `${m}:${s}`;
            }
            const newTitle = `⏱️ ${timeStr} – ${baseTitle}`;
            if (document.title !== newTitle) {
                document.title = newTitle;
            }
            lastState = 'timer';
        } else {
            // Restore base title if not already restored
            if (lastState !== 'base') {
                document.title = baseTitle;
                lastState = 'base';
            }
        }
    }, 1000));
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
    const alarmSoundSelect = document.getElementById('alarmSound');
    const alarmRepeatInput = document.getElementById('alarmRepeat');
    const alarmVolumeInput = document.getElementById('alarmVolume');

    const selectedSound = alarmSoundSelect?.value || 'kitchen';
    const repeatCount = parseInt(alarmRepeatInput?.value) || 1;
    const volume = (parseInt(alarmVolumeInput?.value) || 50) / 100;

    const alarmAudio = document.getElementById("alarm");
    if (!alarmAudio) {
        console.warn('Alarm audio element not found');
        return;
    }

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
    const tickSoundSelect = document.getElementById('tickSound');
    const tickVolumeInput = document.getElementById('tickVolume');

    if (!tickSoundSelect || !tickVolumeInput) {
        // Settings modal henüz yüklenmemiş, varsayılan değerleri kullan
        tickAudio.pause();
        tickAudio.src = '';
        return;
    }

    const selectedTick = tickSoundSelect.value || 'none';
    const volume = (parseInt(tickVolumeInput.value) || 50) / 100;

    if (selectedTick === 'none') {
        tickAudio.pause();
        tickAudio.src = '';
        return;
    }

    tickAudio.src = `/static/sounds/${selectedTick}.wav`;
    tickAudio.loop = true;
    tickAudio.volume = volume;

    if (isRunning) {
        tickAudio.play().catch(e => console.warn('Tick sound play failed:', e));
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

    const settingsThemeToggle = document.getElementById('settingsThemeToggle');
    const headerThemeToggle = document.getElementById('themeToggle');
    const strictModeCheckbox = document.getElementById('strictModeCheckbox');
    const waterReminderCheckbox = document.getElementById('waterReminderCheckbox');

    // Molalar/Pomodorolar otomatik başlasın: işaret değişir değişmez kaydet (modal kapatmaya gerek kalmasın)
    if (autoStartBreaksCheckbox) {
        autoStartBreaksCheckbox.addEventListener('change', () => {
            autoStartBreaks = autoStartBreaksCheckbox.checked;
            saveData();
        });
    }
    if (autoStartPomodorosCheckbox) {
        autoStartPomodorosCheckbox.addEventListener('change', () => {
            autoStartPomodoros = autoStartPomodorosCheckbox.checked;
            saveData();
        });
    }
    if (autoCheckTasksCheckbox) {
        autoCheckTasksCheckbox.addEventListener('change', () => {
            autoCheckTasks = autoCheckTasksCheckbox.checked;
            saveData();
        });
    }
    if (autoSwitchTasksCheckbox) {
        autoSwitchTasksCheckbox.addEventListener('change', () => {
            autoSwitchTasks = autoSwitchTasksCheckbox.checked;
            saveData();
        });
    }
    // Gelişmiş: Strict Mode ve Su Hatırlatıcısı
    if (strictModeCheckbox) {
        strictModeCheckbox.addEventListener('change', () => {
            strictModeEnabled = strictModeCheckbox.checked;
            if (strictModeEnabled) enableStrictMode(); else disableStrictMode();
            saveData();
        });
    }
    if (waterReminderCheckbox) {
        waterReminderCheckbox.addEventListener('change', () => {
            waterReminderEnabled = waterReminderCheckbox.checked;
            if (waterReminderEnabled) setupWaterReminder();
            else {
                if (waterReminderInterval) {
                    clearRegisteredInterval(waterReminderInterval);
                    waterReminderInterval = null;
                }
            }
            saveData();
        });
    }

    // ===== TAB SWITCHING =====
    const tabs = document.querySelectorAll('.settings-tab');
    const tabContents = document.querySelectorAll('.settings-tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');

            // Remove active from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active to clicked tab
            tab.classList.add('active');

            // Show corresponding content
            const targetContent = document.querySelector(`[data-tab-content="${targetTab}"]`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            // Entegrasyonlar sekmesine geçildiğinde engel listesi ve takvim durumunu güncelle
            if (targetTab === 'integrations') {
                if (typeof loadBlockListInSettings === 'function') loadBlockListInSettings();
                if (typeof updateCalendarStatusInSettings === 'function') updateCalendarStatusInSettings();
            }
        });
    });

    // ===== VOLUME DISPLAY UPDATE =====
    const alarmVolumeValue = document.getElementById('alarmVolumeValue');
    const tickVolumeValue = document.getElementById('tickVolumeValue');

    if (alarmVolumeInput && alarmVolumeValue) {
        alarmVolumeInput.addEventListener('input', () => {
            alarmVolumeValue.textContent = alarmVolumeInput.value;
            const volume = parseInt(alarmVolumeInput.value) / 100;
            const alarmAudio = document.getElementById("alarm");
            if (alarmAudio) alarmAudio.volume = volume;
        });
    }

    if (tickVolumeInput && tickVolumeValue) {
        tickVolumeInput.addEventListener('input', () => {
            tickVolumeValue.textContent = tickVolumeInput.value;
            const volume = parseInt(tickVolumeInput.value) / 100;
            if (tickAudio) tickAudio.volume = volume;
        });
    }

    settingsBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Sync theme controls
        const theme = document.documentElement.getAttribute('data-theme') || 'dark';
        const accent = document.documentElement.getAttribute('data-accent') || 'blue';
        if (typeof updateAccentDropdownUI === 'function') updateAccentDropdownUI(accent);
        if (settingsThemeToggle) settingsThemeToggle.textContent = theme === 'light' ? '☀️ Değiştir' : '🌙 Değiştir';

        // Entegrasyonlar sekmesi verilerini güncelle (engel listesi + takvim durumu)
        if (typeof loadBlockListInSettings === 'function') loadBlockListInSettings();
        if (typeof updateCalendarStatusInSettings === 'function') updateCalendarStatusInSettings();

        pomodoroInput.value = durations.pomodoro / 60;
        shortBreakInput.value = durations.short / 60;
        longBreakInput.value = durations.long / 60;
        longBreakIntervalInput.value = longBreakInterval;

        autoStartBreaksCheckbox.checked = autoStartBreaks;
        autoStartPomodorosCheckbox.checked = autoStartPomodoros;
        autoCheckTasksCheckbox.checked = autoCheckTasks;
        autoSwitchTasksCheckbox.checked = autoSwitchTasks;
        if (strictModeCheckbox) strictModeCheckbox.checked = strictModeEnabled;
        if (waterReminderCheckbox) waterReminderCheckbox.checked = waterReminderEnabled;

        // Load saved sound settings and update volume displays
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

            // Update volume displays
            if (alarmVolumeValue) alarmVolumeValue.textContent = alarmVolumeInput.value;
            if (tickVolumeValue) tickVolumeValue.textContent = tickVolumeInput.value;
        });
    });

    // Tema değiştir (Ayarlar içindeki "Değiştir" butonu) document delegasyonu ile yakalanıyor (#settingsThemeToggle -> window.toggleTheme)

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
        strictModeEnabled = strictModeCheckbox ? strictModeCheckbox.checked : strictModeEnabled;
        waterReminderEnabled = waterReminderCheckbox ? waterReminderCheckbox.checked : waterReminderEnabled;
        if (strictModeEnabled) enableStrictMode(); else disableStrictMode();
        if (waterReminderEnabled) setupWaterReminder();
        else if (waterReminderInterval) {
            clearRegisteredInterval(waterReminderInterval);
            waterReminderInterval = null;
        }

        updateTickSound();
        saveData(); // Persist local
        if (localStorage.getItem('auth_token') && typeof syncProgress === 'function') {
            syncProgress(); // Giriş yapılmışsa ayarları sunucuya gönder
        }
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
        taskModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
}

// ===== TASK SERVICE API =====
class TaskService {
    static get token() {
        return localStorage.getItem('auth_token');
    }

    static async getAll() {
        if (!this.token) return JSON.parse(localStorage.getItem('pomodev_tasks') || '[]');
        try {
            const res = await fetch('/api/tasks', {
                headers: { 'Authorization': this.token }
            });
            if (res.ok) {
                const data = await res.json();
                // Handle standardized response format
                if (data.success && data.data) {
                    return data.data;
                }
                return data; // Fallback for old format
            }
            // Handle error responses
            if (res.status === 401 || res.status === 403) {
                console.warn('Authentication failed, clearing token');
                localStorage.removeItem('auth_token');
                localStorage.removeItem('pomodev_user');
            }
            return [];
        } catch (e) {
            console.error('Error fetching tasks:', e);
            showNotification('Görevler yüklenirken bir hata oluştu', 'error');
            return [];
        }
    }

    static async create(text, project) {
        if (!this.token) return; // Local fallback handled in UI logic usually, but here we strictly use proper backend for logged in users
        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.token
                },
                body: JSON.stringify({ token: this.token, text, project })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                return data.data || data;
            }
            throw new Error(data.error || 'Failed to create task');
        } catch (e) {
            console.error('Error creating task:', e);
            showNotification('Görev oluşturulurken bir hata oluştu: ' + e.message, 'error');
            throw e;
        }
    }

    static async update(id, updates) {
        if (!this.token) return;
        try {
            const res = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.token
                },
                body: JSON.stringify({ token: this.token, ...updates })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Failed to update task');
            }
        } catch (e) {
            console.error('Error updating task:', e);
            showNotification('Görev güncellenirken bir hata oluştu: ' + e.message, 'error');
            throw e;
        }
    }

    static async delete(id) {
        if (!this.token) return;
        try {
            const res = await fetch(`/api/tasks/${id}?token=${this.token}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Failed to delete task');
            }
        } catch (e) {
            console.error('Error deleting task:', e);
            showNotification('Görev silinirken bir hata oluştu: ' + e.message, 'error');
            throw e;
        }
    }
}

// Turuncu "+ Görev Ekle" butonuna tıklanınca modal açılsın (artı ile aynı davranış)
function bindEmptyStateAddTaskButton(container) {
    if (!container) return;
    var btn = container.querySelector('.empty-action-btn[data-empty-action="add-task"]');
    if (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            addTask();
        });
    }
}

// Global load function
async function loadTasks() {
    const tasks = await TaskService.getAll();
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    if (tasks.length === 0 && window.EmptyStates) {
        taskList.innerHTML = window.EmptyStates.render('tasks');
        bindEmptyStateAddTaskButton(taskList);
    } else {
        tasks.forEach(task => {
            renderTaskElement(task);
        });
    }
}


function addTask() {
    const taskModal = document.getElementById('taskModal');
    if (taskModal) {
        taskModal.classList.remove('hidden');
        taskModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Click outside to close
        function closeOnOutside(e) {
            if (e.target === taskModal) {
                taskModal.classList.add('hidden');
                taskModal.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
                taskModal.removeEventListener('click', closeOnOutside);
            }
        }
        taskModal.addEventListener('click', closeOnOutside);
    }
}
window.addTask = addTask;

async function saveTask() {
    const title = document.getElementById('taskTitle').value;
    const project = document.getElementById('taskProject')?.value || 'General';
    // (Ignoring other fields for MVP Relational Migration to keep it clean)

    if (!title.trim()) {
        alert("Lütfen görev başlığı girin.");
        return;
    }

    // 1. API Call
    const token = localStorage.getItem('auth_token');
    if (token) {
        const newTask = await TaskService.create(title, project);
        if (newTask) {
            renderTaskElement(newTask);
        }
    } else {
        // Fallback Local
        const localTask = { id: Date.now(), text: title, project, completed: false };
        let tasks = JSON.parse(localStorage.getItem('pomodev_tasks') || '[]');
        tasks.push(localTask);
        localStorage.setItem('pomodev_tasks', JSON.stringify(tasks));
        renderTaskElement(localTask);
    }

    closeTaskModal();
}

function renderTaskElement(task) {
    const taskList = document.getElementById('taskList');
    const taskElement = document.createElement('div');
    taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
    taskElement.dataset.id = task.id;

    // Sanitize user input to prevent XSS
    const safeText = sanitizeHTML(task.text);
    const safeProject = sanitizeHTML(task.project || 'General');
    const taskId = parseInt(task.id) || 0; // Ensure numeric ID
    const estData = window.TaskEstimation?.getForTask(taskId) || task;
    const est = estData?.estimatedPomos || task.estimatedPomos || 0;
    const actual = estData?.actualPomos || task.actualPomos || 0;

    // Task estimation UI (Pomodoro count)
    const estHtml = window.TaskEstimation ? `
        <div class="task-estimation" data-task-id="${taskId}">
            <span class="est-label">Tahmini:</span>
            <div class="est-buttons">
                ${[1, 2, 3, 4, 5].map(n => `<button class="est-btn ${est === n ? 'active' : ''}" data-est="${n}" title="${n} seans">${n}</button>`).join('')}
            </div>
            ${actual > 0 ? `<span class="est-actual">(${actual} tamamlandı)</span>` : ''}
        </div>
    ` : '';

    taskElement.innerHTML = `
        <div>
            <h4>${safeText}</h4>
            <p class="meta">
               <span>📁 ${safeProject}</span>
            </p>
            ${estHtml}
        </div>
        <div class="task-actions">
            <button class="complete-btn" data-task-id="${taskId}">${task.completed ? '✓' : '○'}</button>
            <button class="delete-btn" data-task-id="${taskId}">🗑️</button>
        </div>
    `;

    // Use event delegation instead of inline onclick
    taskElement.querySelector('.complete-btn').addEventListener('click', function () {
        completeTask(this, taskId);
    });
    taskElement.querySelector('.delete-btn').addEventListener('click', function () {
        deleteTask(this, taskId);
    });

    // Task estimation buttons
    taskElement.querySelectorAll('.est-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const n = parseInt(this.dataset.est);
            if (window.TaskEstimation) {
                window.TaskEstimation.addEstimation(taskId, n);
                task.estimatedPomos = n;
            }
            taskElement.querySelectorAll('.est-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Remove empty state when adding first task
    const emptyState = taskList.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    taskList.prepend(taskElement);
}

async function completeTask(button, id) {
    const taskElement = button.closest('.task-item');
    const isComplete = !taskElement.classList.contains('completed');

    if (isComplete) {
        taskElement.classList.add('completed');
        button.textContent = '✓';

        // Dispatch event for features.js
        window.dispatchEvent(new CustomEvent('taskComplete', {
            detail: { taskId: id }
        }));
    } else {
        taskElement.classList.remove('completed');
        button.textContent = '○';
    }

    // API Call
    const token = localStorage.getItem('auth_token');
    if (token) {
        await TaskService.update(id, { completed: isComplete });
    } else {
        // Local Update
        let tasks = JSON.parse(localStorage.getItem('pomodev_tasks') || '[]');
        const t = tasks.find(x => x.id == id);
        if (t) {
            t.completed = isComplete;
            localStorage.setItem('pomodev_tasks', JSON.stringify(tasks));
        }
    }
}

function showConfirmModal(options = {}) {
    const { title = 'Görevi Sil', message = 'Bu görevi silmek istediğinizden emin misiniz?', confirmText = 'Sil' } = options;
    const modal = document.getElementById('confirmModal');
    if (!modal) return Promise.resolve(false);
    const titleEl = document.getElementById('confirmModalTitle');
    const messageEl = document.getElementById('confirmModalMessage');
    const okBtn = modal.querySelector('.confirm-modal-ok');
    const cancelBtn = modal.querySelector('.confirm-modal-cancel');
    const closeBtn = modal.querySelector('.confirm-modal-close');
    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;
    if (okBtn) okBtn.textContent = confirmText;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    return new Promise((resolve) => {
        const finish = (result) => {
            modal.classList.add('hidden');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            okBtn?.removeEventListener('click', onOk);
            cancelBtn?.removeEventListener('click', onCancel);
            closeBtn?.removeEventListener('click', onCancel);
            modal.removeEventListener('click', onBackdrop);
            document.removeEventListener('keydown', onEscape);
            resolve(result);
        };
        const onOk = () => finish(true);
        const onCancel = () => finish(false);
        const onBackdrop = (e) => { if (e.target === modal) finish(false); };
        const onEscape = (e) => { if (e.key === 'Escape') finish(false); };
        okBtn?.addEventListener('click', onOk);
        cancelBtn?.addEventListener('click', onCancel);
        closeBtn?.addEventListener('click', onCancel);
        modal.addEventListener('click', onBackdrop);
        document.addEventListener('keydown', onEscape);
    });
}

async function deleteTask(button, id) {
    const confirmed = await showConfirmModal({ message: 'Bu görevi silmek istediğinizden emin misiniz?' });
    if (!confirmed) return;

    const taskElement = button.closest('.task-item');
    taskElement.remove();

    // API Call
    const token = localStorage.getItem('auth_token');
    if (token) {
        await TaskService.delete(id);
    } else {
        // Local Delete
        let tasks = JSON.parse(localStorage.getItem('pomodev_tasks') || '[]');
        tasks = tasks.filter(x => x.id != id);
        localStorage.setItem('pomodev_tasks', JSON.stringify(tasks));
    }

    // Show empty state if no tasks left
    const taskList = document.getElementById('taskList');
    if (taskList && !taskList.querySelector('.task-item') && window.EmptyStates) {
        taskList.innerHTML = window.EmptyStates.render('tasks');
        bindEmptyStateAddTaskButton(taskList);
    }
}

// ===== NOTE SERVICE API =====
class NoteService {
    static get token() { return localStorage.getItem('auth_token'); }

    static async getAll() {
        if (!this.token) return JSON.parse(localStorage.getItem('pomodev_notes') || '[]');
        try {
            const res = await fetch('/api/notes', { headers: { 'Authorization': this.token } });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data) {
                    return data.data;
                }
                return data; // Fallback for old format
            }
            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('pomodev_user');
            }
            return [];
        } catch (e) {
            console.error('Error fetching notes:', e);
            showNotification('Notlar yüklenirken bir hata oluştu', 'error');
            return [];
        }
    }

    static async create(content) {
        if (!this.token) {
            const notes = JSON.parse(localStorage.getItem('pomodev_notes') || '[]');
            const newNote = { id: Date.now(), content };
            notes.push(newNote);
            localStorage.setItem('pomodev_notes', JSON.stringify(notes));
            return newNote;
        }
        try {
            const res = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': this.token },
                body: JSON.stringify({ token: this.token, content })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                return data.data || data;
            }
            throw new Error(data.error || 'Failed to create note');
        } catch (e) {
            console.error('Error creating note:', e);
            showNotification('Not oluşturulurken bir hata oluştu: ' + e.message, 'error');
            throw e;
        }
    }

    static async delete(id) {
        if (!this.token) {
            let notes = JSON.parse(localStorage.getItem('pomodev_notes') || '[]');
            notes = notes.filter(n => n.id != id);
            localStorage.setItem('pomodev_notes', JSON.stringify(notes));
            return;
        }
        try {
            const res = await fetch(`/api/notes/${id}?token=${this.token}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Failed to delete note');
            }
        } catch (e) {
            console.error('Error deleting note:', e);
            showNotification('Not silinirken bir hata oluştu: ' + e.message, 'error');
            throw e;
        }
    }
}

// ===== BRAIN DUMP LOGIC =====
async function loadNotes() {
    const list = document.getElementById('brainDumpList');
    if (!list) return;
    list.innerHTML = '';
    const notes = await NoteService.getAll();
    notes.forEach(addNoteToUI);
}

function addNoteToUI(note) {
    const list = document.getElementById('brainDumpList');
    const item = document.createElement('div');
    item.className = 'note-item';
    item.dataset.id = note.id;

    // Sanitize user input to prevent XSS
    const safeContent = sanitizeHTML(note.content);
    const noteId = parseInt(note.id) || 0;

    item.innerHTML = `
        <span>${safeContent}</span>
        <button class="delete-note-btn" data-note-id="${noteId}">&times;</button>
    `;

    // Use event listener instead of inline onclick
    item.querySelector('.delete-note-btn').addEventListener('click', function () {
        deleteNote(this, noteId);
    });

    list.prepend(item);
}

async function addNote() {
    const input = document.getElementById('brainDumpInput');
    const content = input.value.trim();
    if (!content) return;

    const note = await NoteService.create(content);
    if (note) {
        addNoteToUI(note);
        input.value = '';
    }
}

async function deleteNote(btn, id) {
    await NoteService.delete(id);
    btn.parentElement.remove();
}

function setupBrainDump() {
    const btn = document.getElementById('addNoteBtn');
    const input = document.getElementById('brainDumpInput');
    const startWithoutGoalBtn = document.getElementById('startWithoutGoalBtn');

    if (btn && input) {
        btn.onclick = addNote;
        input.onkeydown = (e) => { if (e.key === 'Enter') addNote(); };
    }

    // setupBrainDump logic corrected
}


// ===== TIMELINE FORECAST LOGIC =====
function updateTimeline() {
    const container = document.getElementById('sessionTimeline');
    if (!container) return;
    container.innerHTML = '';

    let time = new Date();
    time.setSeconds(0);
    time.setMinutes(time.getMinutes() + 1);

    // Kronometre modunda sabit süre yok; tahmin için pomodoro kabul et
    let mode = currentMode === 'stopwatch' ? 'pomodoro' : currentMode;
    let cycles = cycleCount;

    let displayTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let nowLabel = mode === 'pomodoro' ? 'Odak' : (mode === 'short' ? 'Kısa Mola' : mode === 'long' ? 'Uzun Mola' : 'Kronometre');
    let html = `
        <div class="timeline-item active">
            <span class="time">${displayTime}</span>
            <span class="label">Şimdi: ${nowLabel}</span>
        </div>
    `;

    for (let i = 0; i < 5; i++) {
        let durationMin = (durations[mode] || durations.pomodoro) / 60;
        if (durationMin <= 0) durationMin = 25;
        time.setMinutes(time.getMinutes() + durationMin);

        // Determine next mode
        if (mode === 'pomodoro') {
            cycles++;
            if (cycles % longBreakInterval === 0) mode = 'long';
            else mode = 'short';
        } else {
            mode = 'pomodoro';
        }

        displayTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        html += `
            <div class="timeline-item">
                <span class="time">${displayTime}</span>
                <span class="label">${mode === 'pomodoro' ? 'Odak' : (mode === 'short' ? 'Kısa Mola' : 'Uzun Mola')}</span>
            </div>
        `;
    }

    container.innerHTML = html;
    const estTimeEl = document.getElementById('estimatedFinishTime');
    if (estTimeEl) estTimeEl.textContent = displayTime;
}

// Call Forecast Update periodically
const timelineInterval = registerInterval(setInterval(updateTimeline, 60000));

// ===== İSTATİSTİKLER FONKSİYONLARI =====
function setupStatistics() {
    // İstatistik DOM elemanları loadData/updateStatistics ile güncellenir; burada ek init gerekmez
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
async function handleNotificationsToggle(notificationsBtn) {
    if (!notificationsBtn) notificationsBtn = document.getElementById('notificationsBtn');
    if (!notificationsBtn) return;
    if (notificationsEnabled) {
        notificationsEnabled = false;
        notificationsBtn.classList.remove('enabled');
        notificationsBtn.textContent = '🔔 Aç/Kapa';
    } else {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            notificationsEnabled = true;
            notificationsBtn.classList.add('enabled');
            notificationsBtn.textContent = '🔕 Aç/Kapa';
        } else {
            alert('Bildirim izni verilmedi. Lütfen tarayıcı ayarlarından izin verin.');
        }
    }
    saveData();
}

function setupNotifications() {
    // Bildirim butonu tıklaması document delegasyonu ile yakalanıyor (#notificationsBtn)
    // Sadece sayfa yüklendiğinde buton metnini kaydedilen duruma göre güncelle
    const notificationsBtn = document.getElementById('notificationsBtn');
    if (notificationsBtn) {
        if (notificationsEnabled) {
            notificationsBtn.classList.add('enabled');
            notificationsBtn.textContent = '🔕 Aç/Kapa';
        } else {
            notificationsBtn.classList.remove('enabled');
            notificationsBtn.textContent = '🔔 Aç/Kapa';
        }
    }
}

function showNotification(title, body, badge = null) {
    // Always show toast notification
    showToast(title, body);

    // Also show native notification if enabled
    if (notificationsEnabled && Notification.permission === 'granted') {
        const options = {
            body: body,
            icon: '/static/favicon.svg',
            badge: '/static/favicon.svg',
            requireInteraction: false,
            tag: 'pomodev-notification'
        };

        if (badge !== null) {
            options.badge = badge;
        }

        const notification = new Notification(title, options);

        setTimeout(() => {
            notification.close();
        }, 5000);

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
}

// Toast notification for visual feedback
function showToast(title, message) {
    // Remove existing toast
    const existingToast = document.querySelector('.pomodev-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'pomodev-toast';
    toast.innerHTML = `
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
    `;
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Make showNotification globally available
window.showNotification = showNotification;
window.showToast = showToast;

// ===== TAM EKRAN MODU =====
function setupFullscreen() {
    document.querySelectorAll('.fullscreen-trigger').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().then(() => {
                    document.querySelectorAll('.fullscreen-trigger').forEach(b => b.textContent = '⛶');
                });
            } else {
                document.exitFullscreen().then(() => {
                    document.querySelectorAll('.fullscreen-trigger').forEach(b => b.textContent = '⛶');
                });
            }
        });
    });
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
        strictModeEnabled,
        waterReminderEnabled,
        // Sound settings
        alarmSound: document.getElementById('alarmSound')?.value || 'kitchen',
        alarmRepeat: parseInt(document.getElementById('alarmRepeat')?.value) || 1,
        alarmVolume: parseInt(document.getElementById('alarmVolume')?.value) || 50,
        tickSound: document.getElementById('tickSound')?.value || 'none',
        tickVolume: parseInt(document.getElementById('tickVolume')?.value) || 50,
        // Timer State Persistence
        timerState: {
            isRunning: isRunning,
            mode: currentMode,
            remainingTime: remainingTime,
            endTimestamp: endTimestamp,
            stopwatchElapsed: stopwatchElapsed,
            stopwatchStartTime: stopwatchStartTime,
            lastSaveTime: Date.now()
        }
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
        }

        // === TIMER STATE RESTORATION ===
        // Sayfa yenilendiğinde veya geri gelindiğinde timer durumunu kurtar
        if (data.timerState) {
            const state = data.timerState;
            // Modu geri yükle
            currentMode = state.mode || 'pomodoro';
            updateModeStyles();
            updateFocusMessage();

            if (state.isRunning) {
                // ÇALIŞIYORSA: Geçen süreyi hesapla ve devam et
                const timePassed = Math.floor((Date.now() - state.lastSaveTime) / 1000);

                if (currentMode === 'stopwatch') {
                    // Start time relative to now for correct display
                    // Total elapsed = (Previously Accumulated) + (Run duration before save) + (Time since save)
                    const runDurationBeforeSave = (state.stopwatchStartTime > 0) ? Math.floor((state.lastSaveTime - state.stopwatchStartTime) / 1000) : 0;
                    stopwatchElapsed = (state.stopwatchElapsed || 0) + runDurationBeforeSave + timePassed;

                    stopwatchStartTime = Date.now() - (stopwatchElapsed * 1000);
                    // actuallyStartTimer() çağrısı yerine doğrudan timer'ı başlat
                    isRunning = true;
                    const startBtn = document.querySelector('.start-btn');
                    if (startBtn) startBtn.textContent = 'PAUSE';
                    // Worker'ı başlat
                    try {
                        if (timerWorker) {
                            timerWorker.postMessage({ action: 'START' });
                        }
                    } catch (e) {}
                    // Timer'ı başlat
                    if (!timer) {
                        timer = setInterval(() => {
                            if (isRunning) {
                                timerTick();
                            }
                        }, 100);
                    }
                    // iOS save interval'ı başlat
                    if (typeof window !== 'undefined' && window.navigator && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
                        if (window._iosSaveInterval) {
                            clearInterval(window._iosSaveInterval);
                        }
                        window._iosSaveInterval = setInterval(() => {
                            if (isRunning) {
                                saveData();
                            }
                        }, 1000);
                    }
                    displayTime();
                } else {
                    // Countdown modes
                    // iOS / Safari arka plan senaryolarında daha sağlam olması için mümkünse doğrudan
                    // endTimestamp üzerinden kalan süreyi hesapla. Bu, worker tamamen öldürülse bile
                    // gerçek duvar saatine göre zamanın akmasını garanti eder.
                    if (state.endTimestamp && typeof state.endTimestamp === 'number') {
                        remainingTime = Math.max(
                            0,
                            Math.floor((state.endTimestamp - Date.now()) / 1000)
                        );
                    } else {
                        // Geriye dönük uyumluluk: eski kayıtlarda sadece remainingTime/lastSaveTime olabilir
                        remainingTime = (state.remainingTime || durations[currentMode]) - timePassed;
                    }

                    if (remainingTime <= 0) {
                        // Süre dolmuş
                        remainingTime = 0;
                        displayTime();
                        isRunning = false;
                        endTimestamp = 0;
                        const startBtn = document.querySelector('.start-btn');
                        if (startBtn) startBtn.textContent = 'START';
                    } else {
                        // Hala süre var, devam et
                        remainingTime = Math.max(0, remainingTime);
                        // Yeni endTimestamp'i güncelle ki görünürlük değişimlerinde de duvar saati bazlı çalışsın
                        endTimestamp = Date.now() + remainingTime * 1000;
                        // actuallyStartTimer() çağrısı yerine doğrudan timer'ı başlat
                        isRunning = true;
                        const startBtn = document.querySelector('.start-btn');
                        if (startBtn) startBtn.textContent = 'PAUSE';
                        // Worker'ı başlat
                        try {
                            if (timerWorker) {
                                timerWorker.postMessage({ action: 'START' });
                            }
                        } catch (e) {}
                        // Timer'ı başlat
                        if (!timer) {
                            timer = setInterval(() => {
                                if (isRunning) {
                                    timerTick();
                                }
                            }, 100);
                        }
                        // iOS save interval'ı başlat
                        if (typeof window !== 'undefined' && window.navigator && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
                            if (window._iosSaveInterval) {
                                clearInterval(window._iosSaveInterval);
                            }
                            window._iosSaveInterval = setInterval(() => {
                                if (isRunning) {
                                    saveData();
                                }
                            }, 1000);
                        }
                        displayTime();
                    }
                }
            } else {
                // PAUSE DURUMUNDAYSA: Olduğu gibi geri yükle (zaman geçmemiş varsay, çünkü duraklatılmıştı)
                // Kullanıcı durdurup gitti, geri geldiğinde aynen bulmalı.
                // PAUSE DURUMUNDAYSA: Olduğu gibi geri yükle
                if (currentMode === 'stopwatch') {
                    // Eğer duraklatılmışsa, kaydedilen stopwatchElapsed zaten toplam süredir?
                    // Hayır, eğer pause yapıp save ettiysek stopwatchElapsed güncellenmiştir.
                    // Ancak 'saveData' fonksiyonu pause anında (beforeunload vs) çağrıldığında
                    // stopwatchElapsed henüz güncellenmemiş olabilir mi?
                    // resetTimer içinde güncelleniyor. Ancak visibilityChange'de sadece saveData çağrılıyor.
                    // Durum: Pause ise stopwatchStartTime 0'dır, stopwatchElapsed günceldir.
                    // Durum: Çalışıyorken kapandıysa (üstteki if bloğu), ama isRunning false kaydedildiyse?
                    // isRunning false ise save anında duruktur. O zaman start time 0'dır.
                    stopwatchElapsed = state.stopwatchElapsed || 0;
                    stopwatchStartTime = 0;
                    displayTime();
                } else {
                    remainingTime = state.remainingTime || durations[currentMode];
                    endTimestamp = 0;
                    displayTime();
                }
                // Buton zaten START (isRunning=false default)
            }
        } else {
            // Timer verisi yoksa standart yükleme
            if (!isRunning) {
                remainingTime = durations[currentMode] || 1500;
                endTimestamp = 0;
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
        strictModeEnabled = data.strictModeEnabled === true;
        waterReminderEnabled = data.waterReminderEnabled !== false;

        // Strict Mode ve Su Hatırlatıcısı uygula
        if (strictModeEnabled) enableStrictMode(); else disableStrictMode();
        if (waterReminderEnabled) setupWaterReminder();
        else {
            if (waterReminderInterval) {
                clearRegisteredInterval(waterReminderInterval);
                waterReminderInterval = null;
            }
        }

        // Bildirim butonunu güncelle
        const notificationsBtn = document.getElementById('notificationsBtn');
        if (notificationsBtn) {
            if (notificationsEnabled) {
                notificationsBtn.classList.add('enabled');
                notificationsBtn.textContent = '🔕 Aç/Kapa';
            } else {
                notificationsBtn.classList.remove('enabled');
                notificationsBtn.textContent = '🔔 Aç/Kapa';
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
let streakReminderInterval = null;
function setupStreakReminder() {
    // Sayfa yüklendiğinde kontrol et
    registerTimeout(setTimeout(() => {
        checkStreakReminder();
    }, 3000)); // 3 saniye sonra kontrol et

    // Clear existing interval if any
    if (streakReminderInterval) {
        clearRegisteredInterval(streakReminderInterval);
    }

    // Her saat başı kontrol et
    streakReminderInterval = registerInterval(setInterval(() => {
        checkStreakReminder();
    }, 60 * 60 * 1000)); // 1 saat
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

// ===== MINI PLAYER – Masaüstüne alabilmek için ayrı pencere (popup) açılır =====
window._pomodevMiniWindow = null;
const MINI_PLAYER_W = 320;
const MINI_PLAYER_H = 260;

function openMiniPlayerPopup() {
    if (window._pomodevMiniWindow && !window._pomodevMiniWindow.closed) {
        window._pomodevMiniWindow.focus();
        return;
    }
    const x = Math.max(0, (window.screen?.availWidth ?? 800) - MINI_PLAYER_W - 24);
    const y = Math.max(0, (window.screen?.availHeight ?? 600) - MINI_PLAYER_H - 24);
    const features = `width=${MINI_PLAYER_W},height=${MINI_PLAYER_H},left=${x},top=${y},resizable=yes,scrollbars=no,menubar=no,toolbar=no,location=no,status=no`;
    const w = window.open('/mini-player', 'pomodev_mini', features);
    if (w) {
        window._pomodevMiniWindow = w;
    } else {
        toggleFloatingMiniInPage();
    }
}

function setupFloatingMini() {
    const floatingMini = document.getElementById('floatingMini');
    const floatingToggle = document.getElementById('floatingToggle');
    const floatingClose = document.getElementById('floatingClose');
    const floatingPlayPause = document.getElementById('floatingPlayPause');
    const floatingHeader = floatingMini?.querySelector('.floating-mini-header');

    const floatingBtns = document.querySelectorAll('.floating-trigger');

    function toggleFloatingMiniInPage() {
        if (!floatingMini) return;
        const isVisible = floatingMini.style.display !== 'none';
        if (isVisible) {
            floatingMini.style.display = 'none';
            floatingBtns.forEach(b => { if (b && b.classList.contains('toggle-btn')) b.textContent = '📱 Aç'; });
        } else {
            floatingMini.style.display = 'flex';
            floatingMini.style.flexDirection = 'column';
            floatingBtns.forEach(b => { if (b && b.classList.contains('toggle-btn')) b.textContent = '📱 Kapat'; });
            updateFloatingMini();
        }
    }

    // Mini Player tıklanınca ayrı pencere aç (masaüstüne sürüklenebilir). Popup engelliyse sayfa içi aç.
    floatingBtns.forEach(floatingBtn => {
        if (floatingBtn) {
            floatingBtn.addEventListener('click', () => openMiniPlayerPopup());
        }
    });

    // In-page floating: sadece header'dan sürükle (YouTube gibi), butonlara tıklanınca drag başlamasın
    let isDragging = false;
    let dragOffsetX, dragOffsetY;

    if (floatingMini && floatingHeader) {
        floatingHeader.style.cursor = 'move';
        floatingHeader.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return;
            isDragging = true;
            const rect = floatingMini.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            document.addEventListener('mousemove', dragFloating);
            document.addEventListener('mouseup', stopDragging);
        });
    }

    function dragFloating(e) {
        if (!isDragging || !floatingMini) return;
        e.preventDefault();
        const x = e.clientX - dragOffsetX;
        const y = e.clientY - dragOffsetY;
        const maxX = window.innerWidth - floatingMini.offsetWidth;
        const maxY = window.innerHeight - floatingMini.offsetHeight;
        floatingMini.style.left = Math.min(Math.max(0, x), maxX) + 'px';
        floatingMini.style.top = Math.min(Math.max(0, y), maxY) + 'px';
        floatingMini.style.right = 'auto';
        floatingMini.style.bottom = 'auto';
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
        floatingBtns.forEach(b => { if (b && b.classList.contains('toggle-btn')) b.textContent = '📱 Aç'; });
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

        let timeString;
        if (currentMode === 'stopwatch') {
            let elapsed = stopwatchElapsed + (isRunning && stopwatchStartTime > 0 ? Math.floor((Date.now() - stopwatchStartTime) / 1000) : 0);
            const h = Math.floor(elapsed / 3600);
            const m = Math.floor((elapsed % 3600) / 60);
            const s = elapsed % 60;
            timeString = h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        } else {
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

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
            else if (currentMode === 'stopwatch') modeText = 'Kronometre';
            floatingModeEl.textContent = modeText;
        }

        if (floatingTitleEl) {
            let modeText = '';
            if (currentMode === 'pomodoro') modeText = 'Pomodoro';
            else if (currentMode === 'short') modeText = 'Kısa Mola';
            else if (currentMode === 'long') modeText = 'Uzun Mola';
            else if (currentMode === 'stopwatch') modeText = 'Kronometre';
            floatingTitleEl.textContent = modeText;
        }

        if (floatingPlayPauseEl) {
            floatingPlayPauseEl.textContent = isRunning ? '⏸' : '▶';
        }
    }

    // Optimized: Run less frequently if not visible, and verify elements exist
    registerInterval(setInterval(() => {
        // Only update if floating mini is active (or popup exists)
        const floatingMini = document.getElementById('floatingMini');
        const isActive = floatingMini && floatingMini.style.display !== 'none';

        if (isActive) {
            updateFloatingMini();
        }
    }, 1000));
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

    // iOS Safari için kritik: pageshow event'i sayfa geri geldiğinde tetiklenir
    window.addEventListener('pageshow', handlePageShow);

    // Sayfa kapatılırken veya gizlenirken veri kaydet (iOS için pagehide kritik)
    window.addEventListener('beforeunload', () => { if (isRunning) saveData(); });
    window.addEventListener('pagehide', () => { 
        if (isRunning) {
            saveData(); // Synchronous save for iOS
            // iOS'ta localStorage'a yazma garantisi için ekstra kontrol
            try {
                localStorage.setItem('pomodev_last_save', Date.now().toString());
            } catch(e) {}
        }
    });
}

// iOS Safari için kritik: Sayfa geri geldiğinde timer state'i kontrol et ve restore et
function handlePageShow(event) {
    // iOS'ta sayfa arka plandan geri geldiğinde timer state'i kontrol et
    // Her durumda timer state'i kontrol et (iOS Safari'de sayfa yeniden yüklenebilir)
    setTimeout(() => {
        restoreTimerStateFromStorage();
        handleVisibilityChange();
    }, 100);
}

// Timer state'i localStorage'dan restore et (iOS Safari için kritik)
async function restoreTimerStateFromStorage() {
    try {
        const data = await dataManager.load();
        if (!data || !data.timerState) {
            // Timer state yoksa, mevcut timer'ı durdur
            if (isRunning) {
                if (timer) {
                    clearInterval(timer);
                    timer = null;
                }
                isRunning = false;
            }
            return;
        }

        const state = data.timerState;
        
        // iOS Safari için KRİTİK: Timer state varsa mutlaka kontrol et ve restore et
        // Eğer timer çalışıyorsa ve şu an çalışmıyorsa, restore et
        if (state.isRunning) {
            // Timer çalışıyor olmalı ama çalışmıyor - restore et
            if (!isRunning || !timer) {
            const timePassed = Math.floor((Date.now() - state.lastSaveTime) / 1000);
            
            // Modu geri yükle
            if (state.mode) {
                currentMode = state.mode;
                updateModeStyles();
                updateFocusMessage();
            }

            if (currentMode === 'stopwatch') {
                const runDurationBeforeSave = (state.stopwatchStartTime > 0) ? Math.floor((state.lastSaveTime - state.stopwatchStartTime) / 1000) : 0;
                stopwatchElapsed = (state.stopwatchElapsed || 0) + runDurationBeforeSave + timePassed;
                stopwatchStartTime = Date.now() - (stopwatchElapsed * 1000);
                // actuallyStartTimer() çağrısı yerine doğrudan timer'ı başlat
                isRunning = true;
                const startBtn = document.querySelector('.start-btn');
                if (startBtn) startBtn.textContent = 'PAUSE';
                // Worker'ı başlat
                try {
                    if (timerWorker) {
                        timerWorker.postMessage({ action: 'START' });
                    }
                } catch (e) {}
                    // Timer'ı başlat
                    if (!timer) {
                        timer = setInterval(() => {
                            if (isRunning) {
                                timerTick();
                            }
                        }, 100);
                    }
                    // iOS save interval'ı başlat
                    if (typeof window !== 'undefined' && window.navigator && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
                        if (window._iosSaveInterval) {
                            clearInterval(window._iosSaveInterval);
                        }
                        window._iosSaveInterval = setInterval(() => {
                            if (isRunning) {
                                saveData();
                            }
                        }, 1000);
                    }
                    displayTime();
                } else {
                // Countdown modes
                if (state.endTimestamp && typeof state.endTimestamp === 'number') {
                    remainingTime = Math.max(0, Math.floor((state.endTimestamp - Date.now()) / 1000));
                } else {
                    remainingTime = (state.remainingTime || durations[currentMode]) - timePassed;
                }

                if (remainingTime > 0) {
                    endTimestamp = Date.now() + remainingTime * 1000;
                    // actuallyStartTimer() çağrısı yerine doğrudan timer'ı başlat
                    isRunning = true;
                    const startBtn = document.querySelector('.start-btn');
                    if (startBtn) startBtn.textContent = 'PAUSE';
                    // Worker'ı başlat
                    try {
                        if (timerWorker) {
                            timerWorker.postMessage({ action: 'START' });
                        }
                    } catch (e) {}
                    // Timer'ı başlat
                    if (!timer) {
                        timer = setInterval(() => {
                            if (isRunning) {
                                timerTick();
                            }
                        }, 100);
                    }
                    // iOS save interval'ı başlat
                    if (typeof window !== 'undefined' && window.navigator && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
                        if (window._iosSaveInterval) {
                            clearInterval(window._iosSaveInterval);
                        }
                        window._iosSaveInterval = setInterval(() => {
                            if (isRunning) {
                                saveData();
                            }
                        }, 1000);
                    }
                    displayTime();
                } else {
                    remainingTime = 0;
                    displayTime();
                }
            }
        } else if (state.isRunning && isRunning) {
            // Timer zaten çalışıyor ama senkronize et
            if (currentMode !== 'stopwatch' && state.endTimestamp) {
                const timeLeft = Math.max(0, Math.floor((state.endTimestamp - Date.now()) / 1000));
                remainingTime = timeLeft;
                if (remainingTime <= 0) {
                    remainingTime = 0;
                    isRunning = false;
                    endTimestamp = 0;
                    runTimerCompleteLogic();
                } else {
                    endTimestamp = Date.now() + remainingTime * 1000;
                    // Worker'ı başlat
                    try {
                        if (timerWorker) {
                            timerWorker.postMessage({ action: 'START' });
                        }
                    } catch (e) {}
                    // Timer'ı başlat
                    if (!timer) {
                        timer = setInterval(() => {
                            if (isRunning) {
                                timerTick();
                            }
                        }, 100);
                    }
                    // iOS save interval'ı başlat
                    if (typeof window !== 'undefined' && window.navigator && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
                        if (window._iosSaveInterval) {
                            clearInterval(window._iosSaveInterval);
                        }
                        window._iosSaveInterval = setInterval(() => {
                            if (isRunning) {
                                saveData();
                            }
                        }, 1000);
                    }
                    displayTime();
                }
            }
        }
    } catch (e) {
        console.error('Timer state restore failed:', e);
    }
}

let lastAutoSave = 0;
function handleAutoSave() {
    // iOS Safari için kritik: Daha sık kaydet (arka plana geçince kaybolmasın)
    const isIOS = typeof window !== 'undefined' && window.navigator && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const saveInterval = isIOS ? 2000 : 5000; // iOS'ta 2 saniyede bir, diğerlerinde 5 saniyede bir
    
    const now = Date.now();
    if (now - lastAutoSave > saveInterval) {
        saveData();
        lastAutoSave = now;
    }
}

function handleVisibilityChange() {
    if (document.hidden) {
        // Sayfa arka plana alındı
        isPageVisible = false;
        if (isRunning) {
            // iOS Safari için KRİTİK: Hemen kaydet
            saveData();
            // iOS için ekstra güvenlik: localStorage'a timestamp kaydet
            try {
                localStorage.setItem('pomodev_last_save', Date.now().toString());
                // endTimestamp'i de ayrı kaydet (çift kontrol)
                localStorage.setItem('pomodev_end_timestamp', endTimestamp.toString());
            } catch(e) {}
        }
    } else {
        // Sayfa tekrar aktif oldu
        isPageVisible = true;

        // iOS Safari için KRİTİK: Her zaman timer state'i kontrol et ve restore et
        // Timer çalışmıyorsa veya timer çalışıyor ama localStorage'daki state farklıysa restore et
        setTimeout(() => {
            restoreTimerStateFromStorage();
        }, 50);
        
        // Eğer timer çalışmıyorsa restore et
        if (!isRunning || !timer) {
            restoreTimerStateFromStorage();
            return;
        }

        // Eğer timer çalışıyorsa, geçen süreyi senkronize et
        if (isRunning && currentMode !== 'stopwatch' && endTimestamp > 0) {
            const timeLeft = Math.max(0, Math.floor((endTimestamp - Date.now()) / 1000));
            remainingTime = timeLeft;
            
            if (remainingTime <= 0) {
                // Süre dolmuş
                timerTick(); // Bitiş mantığını tetikle
            } else {
                endTimestamp = Date.now() + remainingTime * 1000; // endTimestamp'i güncelle
                // Timer çalışmıyorsa başlat
                if (!timer) {
                    timer = setInterval(() => {
                        if (isRunning) {
                            timerTick();
                        }
                    }, 100);
                }
                // iOS save interval'ı başlat
                if (typeof window !== 'undefined' && window.navigator && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
                    if (window._iosSaveInterval) {
                        clearInterval(window._iosSaveInterval);
                    }
                    window._iosSaveInterval = setInterval(() => {
                        if (isRunning) {
                            saveData();
                        }
                    }, 1000);
                }
                displayTime();
            }
        } else if (isRunning && currentMode === 'stopwatch' && stopwatchStartTime > 0) {
            // Stopwatch senk
            // Timer çalışmıyorsa başlat
            if (!timer) {
                timer = setInterval(() => {
                    if (isRunning) {
                        timerTick();
                    }
                }, 100);
            }
            // iOS save interval'ı başlat
            if (typeof window !== 'undefined' && window.navigator && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
                if (window._iosSaveInterval) {
                    clearInterval(window._iosSaveInterval);
                }
                window._iosSaveInterval = setInterval(() => {
                    if (isRunning) {
                        saveData();
                    }
                }, 1000);
            }
            displayTime();
        }
    }
}

let _lastDisplayedSeconds = -1; // Sadece saniye değişince DOM güncelle (performans)

/** Zamanlayıcı bittiğinde çalıştırılır: alarm, istatistik, otomatik mola/pomodoro başlatma. Hem tick hem visibility (arka plan) bitişinde kullanılır. */
function runTimerCompleteLogic() {
    // iOS save interval'ı temizle
    if (window._iosSaveInterval) {
        clearInterval(window._iosSaveInterval);
        window._iosSaveInterval = null;
    }
    document.body.classList.remove('zen-mode');
    playAlarm();
    remainingTime = 0;
    displayTime();

    if (currentMode === 'pomodoro') {
        cycleCount++;
        todayPomodoros++;
        weekPomodoros++;

        try {
            // Dispatch custom event for features.js
            window.dispatchEvent(new CustomEvent('pomodoroComplete', {
                detail: {
                    todayCount: todayPomodoros,
                    weekCount: weekPomodoros,
                    cycleCount: cycleCount
                }
            }));

            if (window.trackEvent) {
                trackEvent('pomodoro_completed', {
                    mode: 'pomodoro',
                    duration: durations.pomodoro / 60,
                    daily_count: todayPomodoros,
                    total_count: cycleCount,
                    goal_set: currentPomodoroGoal ? 'yes' : 'no'
                });
            }

            pomodoroHistory.push({
                timestamp: new Date().toISOString(),
                mode: 'pomodoro',
                duration: durations.pomodoro / 60
            });
            updateStreak();

            let baseXP = 100;
            const potionEnd = parseInt(localStorage.getItem('xp_potion_end') || '0');
            if (Date.now() < potionEnd) baseXP *= 2;

            if (typeof dataManager !== 'undefined') {
                const oldXP = dataManager.getXP();
                const newXP = dataManager.addXP(baseXP);
                checkLevelUp(oldXP, newXP);
                updateGamificationUI();
                if (typeof showXPGain === 'function') showXPGain(baseXP, 'Pomodoro tamamlandı!');
                if (typeof showMotivationMessage === 'function') setTimeout(showMotivationMessage, 500);
            }
            if (typeof checkStreakMilestone === 'function') checkStreakMilestone(currentStreak);
            if (typeof updateStatistics === 'function') updateStatistics();
            saveData();
            if (typeof promptCompletedNote === 'function') promptCompletedNote();
            if (typeof syncSession === 'function') syncSession('pomodoro', durations.pomodoro);
            if (typeof syncProgress === 'function') syncProgress();

            const noAutoSummary = localStorage.getItem('noAutoSummary');
            if (!noAutoSummary && (todayPomodoros === 1 || todayPomodoros % 4 === 0) && typeof showSessionSummary === 'function') {
                setTimeout(showSessionSummary, 1500);
            }

            if (notificationsEnabled && typeof showNotification === 'function') {
                const msg = todayPomodoros > 1
                    ? `Harika! Bugün ${todayPomodoros} pomodoro tamamladın! Streak: ${currentStreak} gün 🔥`
                    : `İlk pomodoron tamamlandı! Streak: ${currentStreak} gün 🔥`;
                showNotification('Pomodoro Tamamlandı! 🎉', msg);
            }
        } catch (e) {
            console.warn('Pomodoro tamamlanma (XP/bildirim) hatası:', e);
        }

        // Görevleri otomatik işaretle
        if (autoCheckTasks) {
            try {
                const firstIncomplete = document.querySelector('.task-item:not(.completed)');
                if (firstIncomplete) {
                    const completeBtn = firstIncomplete.querySelector('.complete-btn');
                    const taskId = parseInt(firstIncomplete.dataset.id || completeBtn?.dataset.taskId || 0);
                    if (completeBtn && taskId) completeTask(completeBtn, taskId);
                }
            } catch (err) { console.warn('autoCheckTasks:', err); }
        }

        // Görevleri otomatik geç: sonraki görevi (ilk tamamlanmamış) vurgula ve görünür yap
        if (autoSwitchTasks) {
            try {
                const nextTask = document.querySelector('.task-item:not(.completed)');
                if (nextTask) {
                    nextTask.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    nextTask.classList.add('task-current');
                    setTimeout(function () { nextTask.classList.remove('task-current'); }, 2500);
                }
            } catch (err) { console.warn('autoSwitchTasks:', err); }
        }

        // OTOMATIK MOLA: Her zaman en sonda çalıştır, diğer kodlar hata verse bile
        var shouldAutoStartBreak = autoStartBreaks || (document.getElementById('autoStartBreaks') && document.getElementById('autoStartBreaks').checked);
        if (shouldAutoStartBreak) {
            var interval = longBreakInterval;
            if (typeof interval !== 'number' || isNaN(interval)) {
                var el = document.getElementById('longBreakInterval');
                interval = el ? parseInt(el.value, 10) : 4;
                if (isNaN(interval)) interval = 4;
            }
            if (cycleCount % interval === 0) {
                setMode('long');
            } else {
                setMode('short');
            }
            // Doğrudan actuallyStartTimer çağır (startTimer hedef modalı vb. atlayıp kesin başlatsın)
            if (typeof actuallyStartTimer === 'function') {
                actuallyStartTimer();
            } else {
                startTimer();
            }
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

        var shouldAutoStartPomodoro = autoStartPomodoros || (document.getElementById('autoStartPomodoros') && document.getElementById('autoStartPomodoros').checked);
        if (shouldAutoStartPomodoro) {
            setMode('pomodoro');
            if (typeof actuallyStartTimer === 'function') {
                actuallyStartTimer();
            } else {
                startTimer();
            }
        }
    }
}

function timerTick() {
    // iOS Safari için KRİTİK: Her zaman endTimestamp'ten kalan süreyi hesapla
    // Worker öldürülse bile zaman doğru akar
    
    if (currentMode === 'stopwatch') {
        // Stopwatch için: elapsed time'ı hesapla
        if (isRunning && stopwatchStartTime > 0) {
            const elapsed = stopwatchElapsed + Math.floor((Date.now() - stopwatchStartTime) / 1000);
            const sec = elapsed % 60;
            if (sec !== _lastDisplayedSeconds) {
                _lastDisplayedSeconds = sec;
                displayTime();
            }
        } else {
            displayTime();
        }
        // Her 5 saniyede bir kaydet
        handleAutoSave();
        return;
    }

    // Countdown modları için: endTimestamp'ten kalan süreyi hesapla
    if (endTimestamp > 0) {
        const timeLeft = Math.max(0, Math.floor((endTimestamp - Date.now()) / 1000));
        remainingTime = timeLeft;
        
        // Sadece saniye değiştiğinde UI'ı güncelle (performans için)
        const sec = remainingTime % 60;
        if (sec !== _lastDisplayedSeconds) {
            _lastDisplayedSeconds = sec;
            displayTime();
        }
        
        // Süre dolmuş mu kontrol et
        if (remainingTime <= 0) {
            _lastDisplayedSeconds = -1;
            // Timer'ı durdur
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
            try {
                if (timerWorker) {
                    timerWorker.postMessage({ action: 'STOP' });
                }
            } catch (e) {}
            isRunning = false;
            endTimestamp = 0;
            const startBtn = document.querySelector('.start-btn');
            if (startBtn) startBtn.textContent = 'START';
            tickAudio.pause();
            tickAudio.src = '';
            runTimerCompleteLogic();
            return;
        }
    } else {
        // endTimestamp yoksa timer durdurulmalı
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
        try {
            if (timerWorker) {
                timerWorker.postMessage({ action: 'STOP' });
            }
        } catch (e) {}
        isRunning = false;
        const startBtn = document.querySelector('.start-btn');
        if (startBtn) startBtn.textContent = 'START';
        tickAudio.pause();
        tickAudio.src = '';
        return;
    }

    // Her 5 saniyede bir otomatik kayıt (iOS Safari için kritik)
    handleAutoSave();
    
    // Tick sesi çal (sadece saniye değiştiğinde)
    const currentSec = remainingTime % 60;
    if (tickAudio && !tickAudio.paused && _lastDisplayedSeconds !== currentSec) {
        tickAudio.currentTime = 0;
        tickAudio.play().catch(() => { });
    }
    
    // XP kazanma (her dakika)
    if (currentMode === 'pomodoro' && remainingTime % 60 === 0 && remainingTime < durations.pomodoro) {
        const oldXP = dataManager.getXP();
        const newXP = dataManager.addXP(1);
        checkLevelUp(oldXP, newXP);
        updateGamificationUI();
        saveData();
    }
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

// ===== HEATMAP SYSTEM =====
function renderHeatmap() {
    const container = document.getElementById('heatmapContainer');
    if (!container) return;

    container.innerHTML = '';
    const today = new Date();
    const days = 28; // 4 weeks

    // Get pomodoro data from history
    const pomodoroData = {};
    pomodoroHistory.forEach(entry => {
        const date = new Date(entry.timestamp).toDateString();
        pomodoroData[date] = (pomodoroData[date] || 0) + 1;
    });

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toDateString();
        const count = pomodoroData[dateStr] || 0;

        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        cell.title = `${date.toLocaleDateString('tr-TR')}: ${count} pomodoro`;

        // Color intensity based on count
        if (count === 0) {
            cell.style.background = 'rgba(255, 255, 255, 0.05)';
        } else if (count <= 2) {
            cell.style.background = 'rgba(77, 163, 255, 0.2)';
        } else if (count <= 4) {
            cell.style.background = 'rgba(77, 163, 255, 0.4)';
        } else if (count <= 6) {
            cell.style.background = 'rgba(77, 163, 255, 0.7)';
        } else {
            cell.style.background = 'rgba(77, 163, 255, 1)';
        }

        container.appendChild(cell);
    }
}

// ===== WEEKLY SUMMARY =====
function updateWeeklySummary() {
    const weeklyHoursEl = document.getElementById('weeklyHours');
    const weeklyPomodorosEl = document.getElementById('weeklyPomodoros');
    const comparisonEl = document.getElementById('weeklyComparison');

    if (!weeklyHoursEl || !weeklyPomodorosEl) return;

    // Calculate weekly stats
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    let weeklyCount = 0;
    pomodoroHistory.forEach(entry => {
        const entryDate = new Date(entry.timestamp);
        if (entryDate >= weekStart) {
            weeklyCount++;
        }
    });

    const weeklyHours = (weeklyCount * 25 / 60).toFixed(1);
    weeklyHoursEl.textContent = weeklyHours;
    weeklyPomodorosEl.textContent = weeklyCount;

    // Comparison with last week
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    let lastWeekCount = 0;
    pomodoroHistory.forEach(entry => {
        const entryDate = new Date(entry.timestamp);
        if (entryDate >= lastWeekStart && entryDate < weekStart) {
            lastWeekCount++;
        }
    });

    if (comparisonEl) {
        if (lastWeekCount === 0) {
            comparisonEl.textContent = '🌱 İlk haftanı başarıyla tamamlıyorsun!';
        } else if (weeklyCount > lastWeekCount) {
            const percent = Math.round(((weeklyCount - lastWeekCount) / lastWeekCount) * 100);
            comparisonEl.textContent = `📈 Geçen haftadan %${percent} daha iyi!`;
        } else if (weeklyCount < lastWeekCount) {
            comparisonEl.textContent = `💪 Geçen hafta ${lastWeekCount} yapmıştın, yakala!`;
        } else {
            comparisonEl.textContent = '🎯 Geçen haftayla aynı tempoda!';
        }
    }
}

// ===== AMBIENT SOUNDS SYSTEM =====
let ambientAudio = null;
let currentAmbientSound = null;

// Free ambient sound URLs (reliable sources)
const AMBIENT_SOUNDS = {
    rain: 'https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3',
    cafe: 'https://assets.mixkit.co/active_storage/sfx/145/145-preview.mp3',
    fire: 'https://assets.mixkit.co/active_storage/sfx/189/189-preview.mp3',
    ocean: 'https://assets.mixkit.co/active_storage/sfx/184/184-preview.mp3',
    forest: 'https://assets.mixkit.co/active_storage/sfx/176/176-preview.mp3'
};

function setupAmbientSounds() {
    const buttons = document.querySelectorAll('.ambient-btn');
    const volumeSlider = document.getElementById('ambientVolume');
    const stopBtn = document.getElementById('stopAmbient');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const sound = btn.dataset.sound;
            playAmbientSound(sound, btn);
        });
    });

    volumeSlider?.addEventListener('input', () => {
        if (ambientAudio) {
            ambientAudio.volume = volumeSlider.value / 100;
        }
    });

    stopBtn?.addEventListener('click', stopAmbientSound);
}

function playAmbientSound(sound, btn) {
    // Stop current if same button clicked
    if (currentAmbientSound === sound && ambientAudio) {
        stopAmbientSound();
        return;
    }

    stopAmbientSound();

    ambientAudio = new Audio(AMBIENT_SOUNDS[sound]);
    ambientAudio.loop = true;
    ambientAudio.volume = (document.getElementById('ambientVolume')?.value || 30) / 100;
    ambientAudio.play().catch(e => console.warn('Ambient ses çalınamadı:', e));

    currentAmbientSound = sound;

    // Update active state
    document.querySelectorAll('.ambient-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function stopAmbientSound() {
    if (ambientAudio) {
        ambientAudio.pause();
        ambientAudio = null;
    }
    currentAmbientSound = null;
    document.querySelectorAll('.ambient-btn').forEach(b => b.classList.remove('active'));
}

// ===== STRICT MODE =====
let strictModeEnabled = false;

function enableStrictMode() {
    strictModeEnabled = true;
    window.addEventListener('beforeunload', strictModeWarning);
    document.getElementById('strictModeIndicator')?.remove();

    // Add visual indicator
    const indicator = document.createElement('div');
    indicator.id = 'strictModeIndicator';
    indicator.className = 'strict-mode-indicator';
    indicator.innerHTML = '🔒 Strict Mode Aktif - Pomodoro tamamlanana kadar ayrılamazsın!';
    document.body.prepend(indicator);
}

function disableStrictMode() {
    strictModeEnabled = false;
    window.removeEventListener('beforeunload', strictModeWarning);
    document.getElementById('strictModeIndicator')?.remove();
}

function strictModeWarning(e) {
    if (isRunning && currentMode === 'pomodoro') {
        e.preventDefault();
        e.returnValue = 'Pomodoro devam ediyor! Ayrılmak istediğinize emin misiniz?';
        return e.returnValue;
    }
}

// ===== WATER REMINDER =====
let waterReminderInterval = null;
let waterReminderEnabled = true; // Tercih (kaydedilir)

function setupWaterReminder() {
    // Clear existing interval if any
    if (waterReminderInterval) {
        clearRegisteredInterval(waterReminderInterval);
    }

    // Remind every 30 minutes
    waterReminderInterval = registerInterval(setInterval(() => {
        if (isRunning) {
            showWaterReminder();
        }
    }, 30 * 60 * 1000)); // 30 minutes
}

function showWaterReminder() {
    const reminder = document.createElement('div');
    reminder.className = 'water-reminder';
    reminder.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 2rem;">💧</span>
            <div>
                <div style="font-weight: 700;">Su İçme Vakti!</div>
                <div style="font-size: 0.85rem; opacity: 0.9;">Sağlıklı kalmak için su içmeyi unutma</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px; border-radius: 8px; cursor: pointer;">✕</button>
        </div>
    `;
    document.body.appendChild(reminder);

    // Auto remove after 10 seconds
    setTimeout(() => reminder.remove(), 10000);
}

// ===== INITIALIZE NEW FEATURES =====
document.addEventListener('DOMContentLoaded', () => {
    // Core Features
    setupHowItWorks();
    setupThemeControls();
    setupGoalNotesInit(); // Critical for timer start
    setupTimerControls(); // Explicitly bound now

    // UI & Tools
    setupFullscreen();
    setupSettingsModal();
    setupKeyboardShortcuts();
    setupPageVisibility();
    setupFloatingMini();
    setupBrainDump();
    setupShareSettings();
    setupCalendarQuickAdd();
    setupSessionSummary();
    setupDragAndArchive();

    // Notifications & Environment
    setupNotifications();
    setupAmbientSounds();
    setupWaterReminder();
    setupDropdown();

    // Data Loading
    loadData();
    loadTasks();
    loadNotes();

    // Visuals
    renderHeatmap();
    updateWeeklySummary();

    // Enable strict mode when timer starts (optional - can be toggled)
    // Comment out if you don't want strict mode by default
    // enableStrictMode();
});

// updateStatistics tek tanım 2590'da; burada sarmalayıcı yok (sonsuz döngüyü önlemek için kaldırıldı)

// ===== HABITS IN SETTINGS =====
function renderHabitsInSettings() {
    const container = document.getElementById('habitsListSettings');
    if (!container) return;

    // Check if habitTracker exists
    if (typeof habitTracker === 'undefined') {
        container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 20px;">Alışkanlık sistemi yükleniyor...</p>';
        return;
    }

    const habits = habitTracker.getHabits();

    if (habits.length === 0) {
        container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 20px;">Henüz alışkanlık eklenmedi. Yukarıdan yeni bir alışkanlık ekleyin.</p>';
        return;
    }

    container.innerHTML = habits.map(habit => {
        const isCompleted = habitTracker.isCompletedToday(habit.id);
        const completionRate = habitTracker.getCompletionRate(habit.id);

        return `
            <div class="habit-item-settings ${isCompleted ? 'completed' : ''}" data-habit-id="${habit.id}">
                <div class="habit-left">
                    <button class="habit-checkbox-settings" onclick="toggleHabitFromSettings(${habit.id})">
                        ${isCompleted ? '✅' : '⭕'}
                    </button>
                    <div class="habit-info-settings">
                        <div class="habit-name-settings">${habit.icon} ${habit.name}</div>
                        <div class="habit-stats-settings">
                            <span>🔥 ${habit.currentStreak} gün</span>
                            <span>📊 ${completionRate}%</span>
                        </div>
                    </div>
                </div>
                <button class="habit-delete-settings" onclick="deleteHabitFromSettings(${habit.id})" title="Sil">🗑️</button>
            </div>
        `;
    }).join('');
}

function addHabitFromSettings() {
    const nameInput = document.getElementById('newHabitName');
    const iconInput = document.getElementById('newHabitIcon');

    if (!nameInput) return;

    const name = nameInput.value.trim();
    const icon = iconInput?.value.trim() || '✅';

    if (!name) {
        showNotification('⚠️ Hata', 'Lütfen bir alışkanlık adı girin.');
        return;
    }

    if (typeof habitTracker !== 'undefined') {
        habitTracker.addHabit(name, icon);
        renderHabitsInSettings();
        showNotification('✅ Alışkanlık eklendi', name);
        nameInput.value = '';
        if (iconInput) iconInput.value = '';
    }
}

function toggleHabitFromSettings(habitId) {
    if (typeof habitTracker === 'undefined') return;

    const isCompleted = habitTracker.isCompletedToday(habitId);

    if (isCompleted) {
        habitTracker.uncompleteHabit(habitId);
    } else {
        habitTracker.completeHabit(habitId);
        showNotification('✅ Alışkanlık tamamlandı!', '');
    }

    renderHabitsInSettings();
}

function deleteHabitFromSettings(habitId) {
    if (typeof habitTracker === 'undefined') return;

    const habit = habitTracker.getHabit(habitId);
    if (!habit) return;

    if (confirm(`"${habit.name}" alışkanlığını silmek istediğinize emin misiniz?`)) {
        habitTracker.deleteHabit(habitId);
        renderHabitsInSettings();
        showNotification('🗑️ Alışkanlık silindi', '');
    }
}

function setHabitIconSettings(icon) {
    const iconInput = document.getElementById('newHabitIcon');
    if (iconInput) {
        iconInput.value = icon;
    }
}

// Make functions globally available
window.addHabitFromSettings = addHabitFromSettings;
window.toggleHabitFromSettings = toggleHabitFromSettings;
window.deleteHabitFromSettings = deleteHabitFromSettings;
window.setHabitIconSettings = setHabitIconSettings;
window.renderHabitsInSettings = renderHabitsInSettings;

// ===== GOOGLE CALENDAR FUNCTIONS =====
function connectGoogleCalendar() {
    if (typeof calendarManager === 'undefined') {
        showNotification('⚠️ Uyarı', 'Calendar sistemi henüz yüklenmedi. Sayfayı yenileyin.');
        return;
    }
    calendarManager.authorize()
        .then(() => {
            updateCalendarStatusInSettings();
            showNotification('✅ Google Calendar bağlantısı başarılı', '');
        })
        .catch((error) => {
            const msg = error && error.message ? error.message : 'Bağlantı kurulamadı';
            showNotification('❌ Bağlantı hatası', msg);
        });
}

function connectGoogleCalendarWithToken() {
    if (typeof calendarManager === 'undefined') {
        showNotification('⚠️ Uyarı', 'Calendar sistemi henüz yüklenmedi. Sayfayı yenileyin.');
        return;
    }
    const token = prompt('Google Calendar access token yapıştırın (OAuth Playground veya benzeri ile alın):');
    if (!token || !token.trim()) return;
    if (window.setGoogleCalendarToken && window.setGoogleCalendarToken(token)) {
        updateCalendarStatusInSettings();
        showNotification('✅ Google Calendar token kaydedildi', '');
    } else {
        showNotification('❌ Hata', 'Token kaydedilemedi');
    }
}

function disconnectGoogleCalendar() {
    if (typeof calendarManager !== 'undefined') {
        calendarManager.disconnect();
        updateCalendarStatusInSettings();
    }
}

function updateCalendarStatusInSettings() {
    const statusText = document.getElementById('calendarStatusText');
    const connectBtn = document.getElementById('calendarConnectBtn');
    const disconnectBtn = document.getElementById('calendarDisconnectBtn');

    if (!statusText) return;

    let isAuthorized = false;
    if (typeof calendarManager !== 'undefined') {
        const status = calendarManager.getStatus();
        isAuthorized = status.authorized;
    }

    if (isAuthorized) {
        statusText.innerHTML = '✅ <strong>Bağlı</strong> - Pomodoro\'lar takvime eklenecek';
        if (connectBtn) connectBtn.style.display = 'none';
        if (disconnectBtn) disconnectBtn.style.display = 'flex';
    } else {
        statusText.innerHTML = '❌ <strong>Bağlı Değil</strong> - Bağlanmak için butona tıklayın';
        if (connectBtn) connectBtn.style.display = 'flex';
        if (disconnectBtn) disconnectBtn.style.display = 'none';
    }
}

window.connectGoogleCalendar = connectGoogleCalendar;
window.connectGoogleCalendarWithToken = connectGoogleCalendarWithToken;
window.disconnectGoogleCalendar = disconnectGoogleCalendar;
window.updateCalendarStatusInSettings = updateCalendarStatusInSettings;

// ===== BLOCKING SETTINGS FUNCTIONS =====
function loadBlockListInSettings() {
    const textarea = document.getElementById('blockListTextarea');
    const checkbox = document.getElementById('blockingEnabled');

    if (!textarea) return;

    const saved = localStorage.getItem('pomodev_blockList');
    const enabled = localStorage.getItem('pomodev_blockingEnabled') !== 'false';

    if (saved) {
        try {
            const sites = JSON.parse(saved);
            // Convert patterns back to simple domain format for display
            textarea.value = sites.map(s => {
                return s.replace('*://*.', '').replace('/*', '');
            }).join('\n');
        } catch (e) {
            textarea.value = '';
        }
    } else {
        // Default list
        textarea.value = [
            'facebook.com',
            'twitter.com',
            'instagram.com',
            'youtube.com',
            'reddit.com',
            'tiktok.com',
            'netflix.com',
            'twitch.tv'
        ].join('\n');
    }

    if (checkbox) {
        checkbox.checked = enabled;
    }
}

// Override the existing saveBlockList and resetBlockList to use our new location
window.saveBlockList = function () {
    const textarea = document.getElementById('blockListTextarea');
    const checkbox = document.getElementById('blockingEnabled');

    if (!textarea || !checkbox) return;

    const sites = textarea.value
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => {
            if (!s.includes('*')) {
                return `*://*.${s}/*`;
            }
            return s;
        });

    localStorage.setItem('pomodev_blockList', JSON.stringify(sites));
    localStorage.setItem('pomodev_blockingEnabled', checkbox.checked.toString());

    showNotification('✅ Engel Listesi Kaydedildi', 'Ayarlar güncellendi');
};

window.resetBlockList = function () {
    const defaultList = [
        'facebook.com',
        'twitter.com',
        'instagram.com',
        'youtube.com',
        'reddit.com',
        'tiktok.com',
        'netflix.com',
        'twitch.tv'
    ];

    const textarea = document.getElementById('blockListTextarea');
    if (textarea) {
        textarea.value = defaultList.join('\n');
    }
    showNotification('🔄 Varsayılanlar Yüklendi', '');
};

// ===== INIT SETTINGS TABS DATA =====
function initSettingsTabsData() {
    // Load blocking list
    loadBlockListInSettings();

    // Render habits
    renderHabitsInSettings();

    // Update calendar status
    updateCalendarStatusInSettings();
}

// Call on settings modal open
const originalSettingsClick = document.getElementById('settingsBtn')?.onclick;
document.addEventListener('DOMContentLoaded', () => {
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        const originalHandler = settingsBtn.onclick;
        settingsBtn.addEventListener('click', () => {
            setTimeout(initSettingsTabsData, 100);
        });
    }
});

// ===== SOCIAL MANAGER =====
class SocialManager {
    constructor() {
        this.heartbeatInterval = null;
        this.pollInterval = null;
        this.badge = document.getElementById('liveUsersBadge');
        this.countEl = document.getElementById('liveUsersCount');

        this.init();
    }

    init() {
        // Initial heartbeat
        this.sendHeartbeat();
        this.fetchStatus();

        // Start loops
        this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), 30000); // 30s
        this.pollInterval = setInterval(() => this.fetchStatus(), 30000); // 30s
    }

    async sendHeartbeat() {
        if (!document.hasFocus()) return; // Don't spam if tab is backgrounded

        try {
            const token = localStorage.getItem('auth_token');
            await fetch('/api/social/heartbeat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ mode: currentMode })
            });
        } catch (e) {
            console.warn('Heartbeat failed', e);
        }
    }

    async fetchStatus() {
        if (document.hidden) return; // Don't poll if backgrounded

        try {
            const res = await fetch('/api/social/status');
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    this.updateUI(data.data);
                }
            }
        } catch (e) {
            console.warn('Social poll failed', e);
        }
    }

    updateUI(data) {
        if (!this.badge || !this.countEl) return;

        const count = data.active_users || 1;
        this.countEl.textContent = count;

        // Show badge if count > 1 (meaning other people are online)
        // Or always show it to make the app feel alive (Strategy: Always show)
        this.badge.style.display = 'flex';

        // Optional snippet: Update title with count? 
        // document.title = `(${count}) Pomodev`;
    }
}

// Init Social Manager
const socialManager = new SocialManager();
window.socialManager = socialManager;

// ===== AI TASK BREAKDOWN =====
let generatedSubtasks = [];

async function triggerAIMagic() {
    const titleInput = document.getElementById('taskTitle');
    if (!titleInput || !titleInput.value.trim()) {
        showNotification('⚠️ Uyarı', 'Lütfen önce bir görev başlığı yazın');
        return;
    }

    const taskText = titleInput.value.trim();
    const btn = document.querySelector('.ai-magic-btn');

    // UI Loading
    if (btn) btn.classList.add('loading');

    try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('/api/ai/breakdown-task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({ text: taskText })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            generatedSubtasks = data.data.subtasks || [];
            showAIModal(generatedSubtasks);
        } else {
            showNotification('❌ Hata', data.error || 'AI yanıt vermedi');
        }
    } catch (e) {
        console.error("AI Error:", e);
        showNotification('❌ Hata', 'Sunucu hatası');
    } finally {
        if (btn) btn.classList.remove('loading');
    }
}

function showAIModal(subtasks) {
    const modal = document.getElementById('aiModal');
    const list = document.getElementById('aiResultsList');
    if (!modal || !list) return;

    list.innerHTML = '';

    subtasks.forEach(sub => {
        const div = document.createElement('div');
        div.style.padding = '8px';
        div.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.innerHTML = `
            <span style="color:#22c55e; margin-right:8px;">↳</span>
            <span style="color:var(--text-primary);">${sub}</span>
        `;
        list.appendChild(div);
    });

    modal.classList.remove('hidden');
}

function closeAIModal() {
    const modal = document.getElementById('aiModal');
    if (modal) modal.classList.add('hidden');
}

async function acceptAISubtasks() {
    const title = document.getElementById('taskTitle').value;
    const project = document.getElementById('taskProject').value || 'AI Breakdown';
    const category = document.getElementById('taskCategory').value || 'work';

    closeAIModal();
    // closeTaskModal(); // Keep open or close? Let's close for now as requested in flow
    if (typeof closeTaskModal === 'function') closeTaskModal();

    showNotification('✨', `${generatedSubtasks.length} alt görev oluşturuluyor...`);

    // Add Main Parent Task
    if (title) {
        await addTaskDirectly(title, project, category);
    }

    // Add Subtasks
    for (const sub of generatedSubtasks) {
        await new Promise(r => setTimeout(r, 150)); // stagger
        await addTaskDirectly(sub, project, category);
    }

    showNotification('✅ Tamamlandı', 'Tüm görevler eklendi');
}

// Helper to add task without UI interaction
async function addTaskDirectly(text, project, category) {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
        await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                text: text,
                est_pomodoros: 1,
                project: project,
                category: category,
                priority: 'normal'
            })
        });
        if (typeof loadTasks === 'function') loadTasks();
    } catch (e) {
        console.error("Add task failed", e);
    }
}

// Expose
window.triggerAIMagic = triggerAIMagic;
window.closeAIModal = closeAIModal;
window.acceptAISubtasks = acceptAISubtasks;

// ===== TODOIST INTEGRATION =====
async function importFromTodoist() {
    let token = localStorage.getItem('todoist_token');

    // Always check for token or prompt
    if (!token) {
        token = prompt("Lütfen Todoist API Token'ınızı girin:\n(Todoist Ayarlar > Entegrasyonlar > API Token)");
        if (!token) return; // User cancelled
        localStorage.setItem('todoist_token', token);
    }

    showNotification('⏳', 'Todoist görevleri alınıyor...');

    try {
        const authToken = localStorage.getItem('auth_token');
        const res = await fetch('/api/integrations/todoist/import', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authToken ? `Bearer ${authToken}` : ''
            },
            body: JSON.stringify({ todoistToken: token })
        });

        const data = await res.json();

        if (res.ok) {
            showNotification('✅ Başarılı', `${data.data.count} yeni görev eklendi!`);
            if (typeof loadTasks === 'function') loadTasks();
        } else {
            showNotification('❌ Hata', data.error || 'İçe aktarma başarısız');
            // Clear invalid token so they can try again
            if (res.status === 400 && data.error.includes('token')) {
                localStorage.removeItem('todoist_token');
            }
        }
    } catch (e) {
        console.error("Todoist Error:", e);
        showNotification('❌ Hata', 'Sunucu hatası');
    }
}

window.importFromTodoist = importFromTodoist;
