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

// Ayar değişkenleri
let autoStartBreaks = false;
let autoStartPomodoros = false;
let autoCheckTasks = false;
let autoSwitchTasks = true;

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
    loadData();
    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
    setupHowItWorks();
});

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
    displayTime();
    document.querySelector('.start-btn').textContent = 'START';
    tickAudio.pause();
    tickAudio.src = '';
    
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
    isRunning = true;
    document.querySelector('.start-btn').textContent = 'PAUSE';
    updateTickSound();
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
        } catch {}
    }
}

// export/import kaldırıldı

// ===== TAKVİM HIZLI EKLE =====
function setupCalendarQuickAdd() {
    document.getElementById('quickAddCalendar')?.addEventListener('click', () => {
        const minutes = currentMode === 'pomodoro' ? (durations.pomodoro/60) : currentMode==='short' ? (durations.short/60) : (durations.long/60);
        const title = currentMode === 'pomodoro' ? (currentPomodoroGoal || 'Pomodoro') : (currentMode==='short'?'Short Break':'Long Break');
        const start = new Date();
        const end = new Date(start.getTime() + minutes * 60000);
        const fmt = d => d.toISOString().replace(/[-:]|\.\d{3}/g, '').slice(0,15) + 'Z';
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
            count++;
            alarmAudio.currentTime = 0;
            alarmAudio.play().catch(err => console.warn("Alarm tekrar çalınamadı:", err));

            // tekrar için de 5 saniye sınırlaması
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
        longBreakIntervalInput.value = 4;

        autoStartBreaksCheckbox.checked = autoStartBreaks;
        autoStartPomodorosCheckbox.checked = autoStartPomodoros;
        autoCheckTasksCheckbox.checked = autoCheckTasks;
        autoSwitchTasksCheckbox.checked = autoSwitchTasks;
        alarmSoundSelect.value = 'kitchen';
        alarmRepeatInput.value = 1;
        alarmVolumeInput.value = 50;
        tickSoundSelect.value = 'none';
        tickVolumeInput.value = 50;
    });

    closeBtn.addEventListener('click', () => {
        const newPomodoro = parseInt(pomodoroInput.value);
        const newShort = parseInt(shortBreakInput.value);
        const newLong = parseInt(longBreakInput.value);

        if (!isNaN(newPomodoro) && newPomodoro > 0) {
            durations.pomodoro = newPomodoro * 60;
            if (currentMode === 'pomodoro') resetTimer();
        }
        if (!isNaN(newShort) && newShort > 0) {
            durations.short = newShort * 60;
            if (currentMode === 'short') resetTimer();
        }
        if (!isNaN(newLong) && newLong > 0) {
            durations.long = newLong * 60;
            if (currentMode === 'long') resetTimer();
        }

        autoStartBreaks = autoStartBreaksCheckbox.checked;
        autoStartPomodoros = autoStartPomodorosCheckbox.checked;
        autoCheckTasks = autoCheckTasksCheckbox.checked;
        autoSwitchTasks = autoSwitchTasksCheckbox.checked;

        updateTickSound(); // 🔁 Tık sesi güncelle

        modal.classList.add('hidden');
        document.body.style.overflow = '';
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
        // Modal açıksa kısayollar devre dışı
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
        
        // R - Reset
        if (e.key === 'r' || e.key === 'R') {
            e.preventDefault();
            resetTimer();
        }
        
        // S - Settings
        if (e.key === 's' || e.key === 'S') {
            e.preventDefault();
            document.getElementById('settingsBtn').click();
        }
        
        // Escape - Modalları kapat
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal:not(.hidden)');
            modals.forEach(modal => {
                modal.classList.add('hidden');
                document.body.style.overflow = '';
            });
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
        autoStartBreaks,
        autoStartPomodoros,
        autoCheckTasks,
        autoSwitchTasks
    };
    localStorage.setItem('pomodevData', JSON.stringify(data));
}

function loadData() {
    const savedData = localStorage.getItem('pomodevData');
    const today = new Date().toDateString();
    const lastVisitDate = localStorage.getItem('lastVisitDate');
    
    if (savedData) {
        const data = JSON.parse(savedData);
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
        
        taskHistory = data.taskHistory || [];
        notificationsEnabled = data.notificationsEnabled || false;
        autoStartBreaks = data.autoStartBreaks || false;
        autoStartPomodoros = data.autoStartPomodoros || false;
        autoCheckTasks = data.autoCheckTasks || false;
        autoSwitchTasks = data.autoSwitchTasks !== undefined ? data.autoSwitchTasks : true;
        
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
        .sort(([,a], [,b]) => b - a)
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
                handleTimerComplete();
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
    if (remainingTime <= 0) {
        clearInterval(timer);
        isRunning = false;
        document.querySelector('.start-btn').textContent = 'START';
        tickAudio.pause();
        playAlarm();

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
            
            // İstatistikleri güncelle
            updateStatistics();
            saveData();
            promptCompletedNote();
            
            // Show session summary after 1 pomodoro or every 4 (unless disabled)
            const noAutoSummary = localStorage.getItem('noAutoSummary');
            if (!noAutoSummary && (todayPomodoros === 1 || todayPomodoros % 4 === 0)) {
                setTimeout(showSessionSummary, 1500);
            }
            
            // Bildirim gönder
            if (notificationsEnabled) {
                const message = todayPomodoros > 1 
                    ? `Harika! Bugün ${todayPomodoros} pomodoro tamamladın! Streak: ${currentStreak} gün 🔥`
                    : `İlk pomodoron tamamlandı! Streak: ${currentStreak} gün 🔥`;
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

    remainingTime--;
    displayTime();
    
    // Tık sesi çal
    if (tickAudio && !tickAudio.paused) {
        tickAudio.currentTime = 0;
        tickAudio.play().catch(() => {});
    }
}


// Sayfa yüklendiğinde filtrelemeyi ayarla
document.addEventListener('DOMContentLoaded', () => {
    setupTaskFiltering();
});
