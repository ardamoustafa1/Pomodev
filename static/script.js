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
        clearInterval(timer);
        isRunning = false;
        startBtn.textContent = 'START';
        tickAudio.pause();
        return;
    }

    isRunning = true;
    startBtn.textContent = 'PAUSE';
    updateTickSound();

    timer = setInterval(timerTick, 1000);
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    remainingTime = durations[currentMode];
    displayTime();
    document.querySelector('.start-btn').textContent = 'START';
    tickAudio.pause();
    tickAudio.src = '';
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
    
    // Haftalık pomodoro sayısını güncelle
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

function showNotification(title, body) {
    if (notificationsEnabled && Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: '/static/favicon.ico'
        });
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
    if (savedData) {
        const data = JSON.parse(savedData);
        dailyGoal = data.dailyGoal || 8;
        todayPomodoros = data.todayPomodoros || 0;
        weekPomodoros = data.weekPomodoros || 0;
        currentStreak = data.currentStreak || 0;
        pomodoroHistory = data.pomodoroHistory || [];
        taskHistory = data.taskHistory || [];
        notificationsEnabled = data.notificationsEnabled || false;
        autoStartBreaks = data.autoStartBreaks || false;
        autoStartPomodoros = data.autoStartPomodoros || false;
        autoCheckTasks = data.autoCheckTasks || false;
        autoSwitchTasks = data.autoSwitchTasks || true;
        
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
    }
    
    updateStatistics();
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
            
            // Pomodoro geçmişine ekle
            pomodoroHistory.push({
                timestamp: new Date().toISOString(),
                mode: 'pomodoro',
                duration: durations.pomodoro / 60 // dakika cinsinden
            });
            
            // İstatistikleri güncelle
            updateStatistics();
            saveData();
            
            // Bildirim gönder
            if (notificationsEnabled) {
                showNotification('Pomodoro Tamamlandı! 🎉', 'Mola zamanı!');
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
