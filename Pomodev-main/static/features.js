// ===== POMODEV ADVANCED FEATURES =====
// Visual Pomodoro Counter, Achievements, Daily Challenges, Task Estimation

// ===== 1. VISUAL POMODORO COUNTER (⏱) =====
const PomodoroVisualCounter = {
    containerSelector: '#visualPomodoroCounter',

    init() {
        this.render();
        // Listen for pomodoro completions (use event detail for real-time count)
        window.addEventListener('pomodoroComplete', (e) => this.render(e.detail?.todayCount));
    },

    render(todayCountOverride) {
        const container = document.querySelector(this.containerSelector);
        if (!container) return;

        // Get todayCount: event override > pomodevData > 0
        let todayCount = todayCountOverride;
        if (todayCount === undefined) {
            try {
                const data = JSON.parse(localStorage.getItem('pomodevData') || '{}');
                todayCount = data.todayPomodoros || 0;
            } catch {
                todayCount = 0;
            }
        }
        todayCount = parseInt(todayCount) || 0;

        let dailyGoal = 8;
        try {
            const data = JSON.parse(localStorage.getItem('pomodevData') || '{}');
            dailyGoal = parseInt(data.dailyGoal) || 8;
        } catch { }

        let html = '<div class="visual-counter">';
        html += '<div class="counter-label">Bugünkü İlerleme</div>';
        html += '<div class="focus-row">';

        for (let i = 0; i < dailyGoal; i++) {
            if (i < todayCount) {
                html += '<span class="focus-unit completed" title="Tamamlandı">⚡</span>';
            } else {
                html += '<span class="focus-unit pending" title="Bekliyor">⚪</span>';
            }
        }

        // Extra tomatoes if exceeded goal
        if (todayCount > dailyGoal) {
            for (let i = dailyGoal; i < todayCount; i++) {
                html += '<span class="focus-unit bonus" title="Bonus!">⚡</span>';
            }
        }

        html += '</div>';
        html += `<div class="counter-text">${todayCount}/${dailyGoal} Pomodoro</div>`;
        html += '</div>';

        container.innerHTML = html;
    }
};

// ===== 2. TASK ESTIMATION SYSTEM =====
const TaskEstimation = {
    EST_KEY: 'pomodev_task_estimations',

    _getEstimations() {
        try {
            return JSON.parse(localStorage.getItem(this.EST_KEY) || '{}');
        } catch { return {}; }
    },

    _saveEstimations(est) {
        localStorage.setItem(this.EST_KEY, JSON.stringify(est));
    },

    // Add estimation to task (works for both local and API tasks)
    addEstimation(taskId, estimatedPomos) {
        const est = this._getEstimations();
        const key = String(taskId);
        est[key] = { estimatedPomos, actualPomos: est[key]?.actualPomos || 0 };
        this._saveEstimations(est);
        // Also update pomodev_tasks if task exists there
        const tasks = JSON.parse(localStorage.getItem('pomodev_tasks') || '[]');
        const task = tasks.find(t => String(t.id) === String(taskId));
        if (task) {
            task.estimatedPomos = estimatedPomos;
            task.actualPomos = task.actualPomos || 0;
            localStorage.setItem('pomodev_tasks', JSON.stringify(tasks));
        }
        return est[key];
    },

    // Get estimation for a task (merged from storage)
    getForTask(taskId) {
        const est = this._getEstimations()[String(taskId)];
        if (est) return est;
        const tasks = JSON.parse(localStorage.getItem('pomodev_tasks') || '[]');
        const task = tasks.find(t => String(t.id) === String(taskId));
        return task ? { estimatedPomos: task.estimatedPomos || 0, actualPomos: task.actualPomos || 0 } : null;
    },

    // Increment actual pomos for active task
    incrementActual(taskId) {
        const est = this._getEstimations();
        const key = String(taskId);
        est[key] = est[key] || { estimatedPomos: 0, actualPomos: 0 };
        est[key].actualPomos = (est[key].actualPomos || 0) + 1;
        this._saveEstimations(est);
        const tasks = JSON.parse(localStorage.getItem('pomodev_tasks') || '[]');
        const task = tasks.find(t => String(t.id) === String(taskId));
        if (task) {
            task.actualPomos = est[key].actualPomos;
            localStorage.setItem('pomodev_tasks', JSON.stringify(tasks));
        }
        return est[key];
    },

    // Get estimation accuracy
    getAccuracy() {
        const tasks = JSON.parse(localStorage.getItem('pomodev_tasks') || '[]');
        const est = this._getEstimations();
        const completedWithEstimate = tasks.filter(t => {
            const e = est[String(t.id)] || t;
            const estimated = e.estimatedPomos || t.estimatedPomos || 0;
            const actual = e.actualPomos || t.actualPomos || 0;
            return t.completed && estimated > 0 && actual > 0;
        });

        if (completedWithEstimate.length === 0) return null;

        let totalAccuracy = 0;
        completedWithEstimate.forEach(task => {
            const e = est[String(task.id)] || task;
            const estimated = e.estimatedPomos || 0;
            const actual = e.actualPomos || 0;
            const accuracy = Math.min(estimated, actual) / Math.max(estimated, actual) * 100;
            totalAccuracy += accuracy;
        });

        return Math.round(totalAccuracy / completedWithEstimate.length);
    },

    // Render estimation UI for a task
    renderEstimationUI(taskId, currentEstimate = 0) {
        return `
            <div class="task-estimation" data-task-id="${taskId}">
                <span class="est-label">Tahmini:</span>
                <div class="est-buttons">
                    ${[1, 2, 3, 4, 5].map(n => `
                        <button class="est-btn ${currentEstimate === n ? 'active' : ''}" 
                                onclick="TaskEstimation.addEstimation(${taskId}, ${n}); this.parentElement.querySelectorAll('.est-btn').forEach(b=>b.classList.remove('active')); this.classList.add('active');">
                            ${n}⏱
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }
};

// ===== 3. ACHIEVEMENT SYSTEM =====
const AchievementSystem = {
    achievements: [
        // Pomodoro milestones
        { id: 'first_pomo', name: 'İlk Adım', description: 'İlk pomodoronu tamamla', icon: '🌱', condition: (stats) => stats.totalPomos >= 1 },
        { id: 'pomo_10', name: 'Isınma Turu', description: '10 pomodoro tamamla', icon: '🔥', condition: (stats) => stats.totalPomos >= 10 },
        { id: 'pomo_50', name: 'Odak Ustası', description: '50 pomodoro tamamla', icon: '🎯', condition: (stats) => stats.totalPomos >= 50 },
        { id: 'pomo_100', name: 'Yüzüncü Adım', description: '100 pomodoro tamamla', icon: '💯', condition: (stats) => stats.totalPomos >= 100 },
        { id: 'pomo_500', name: 'Efsane', description: '500 pomodoro tamamla', icon: '🏆', condition: (stats) => stats.totalPomos >= 500 },
        { id: 'pomo_1000', name: 'Pomodoro Tanrısı', description: '1000 pomodoro tamamla', icon: '👑', condition: (stats) => stats.totalPomos >= 1000 },

        // Streak achievements
        { id: 'streak_3', name: 'Tutarlı Başlangıç', description: '3 günlük seri yap', icon: '📅', condition: (stats) => stats.maxStreak >= 3 },
        { id: 'streak_7', name: 'Haftalık Savaşçı', description: '7 günlük seri yap', icon: '🗓️', condition: (stats) => stats.maxStreak >= 7 },
        { id: 'streak_30', name: 'Aylık Maratoncu', description: '30 günlük seri yap', icon: '📆', condition: (stats) => stats.maxStreak >= 30 },
        { id: 'streak_100', name: 'Yüz Gün Ustası', description: '100 günlük seri yap', icon: '🎖️', condition: (stats) => stats.maxStreak >= 100 },

        // Daily achievements
        { id: 'daily_goal', name: 'Hedef Avcısı', description: 'Günlük hedefe ulaş', icon: '🎯', condition: (stats) => stats.dailyGoalReached >= 1 },
        { id: 'daily_goal_10', name: 'Hedef Ustası', description: '10 kez günlük hedefe ulaş', icon: '🏅', condition: (stats) => stats.dailyGoalReached >= 10 },
        { id: 'overachiever', name: 'Üstün Başarı', description: 'Günlük hedefi 2 kat aş', icon: '⭐', condition: (stats) => stats.maxDailyPomos >= stats.dailyGoal * 2 },

        // Task achievements
        { id: 'task_10', name: 'Görev Avcısı', description: '10 görev tamamla', icon: '✅', condition: (stats) => stats.tasksCompleted >= 10 },
        { id: 'task_50', name: 'Verimlilik Ustası', description: '50 görev tamamla', icon: '📋', condition: (stats) => stats.tasksCompleted >= 50 },

        // Time achievements
        { id: 'hour_10', name: '10 Saat Kulübü', description: '10 saat odaklan', icon: '⏰', condition: (stats) => stats.totalMinutes >= 600 },
        { id: 'hour_50', name: '50 Saat Kulübü', description: '50 saat odaklan', icon: '⏱️', condition: (stats) => stats.totalMinutes >= 3000 },
        { id: 'hour_100', name: '100 Saat Efsanesi', description: '100 saat odaklan', icon: '🕐', condition: (stats) => stats.totalMinutes >= 6000 },

        // Special achievements
        { id: 'early_bird', name: 'Erken Kuş', description: 'Sabah 6\'dan önce pomodoro tamamla', icon: '🌅', condition: (stats) => stats.earlyBird },
        { id: 'night_owl', name: 'Gece Kuşu', description: 'Gece 12\'den sonra pomodoro tamamla', icon: '🦉', condition: (stats) => stats.nightOwl },
        { id: 'weekend_warrior', name: 'Hafta Sonu Savaşçısı', description: 'Hafta sonu 10 pomodoro tamamla', icon: '🎮', condition: (stats) => stats.weekendPomos >= 10 },
        { id: 'perfectionist', name: 'Mükemmeliyetçi', description: 'Tahmin doğruluğu %90+ olsun', icon: '💎', condition: (stats) => stats.estimationAccuracy >= 90 },
    ],

    // Get user stats for achievement checking
    getStats() {
        const data = JSON.parse(localStorage.getItem('pomodevData') || '{}');
        const tasks = JSON.parse(localStorage.getItem('pomodev_tasks') || '[]');
        const history = JSON.parse(localStorage.getItem('pomodoroHistory') || '[]');

        return {
            totalPomos: data.totalPomodoros || history.length || 0,
            maxStreak: data.maxStreak || parseInt(localStorage.getItem('currentStreak') || '0'),
            dailyGoalReached: data.dailyGoalReached || 0,
            maxDailyPomos: data.maxDailyPomos || 0,
            dailyGoal: parseInt(localStorage.getItem('dailyGoal') || '8'),
            tasksCompleted: tasks.filter(t => t.completed).length,
            totalMinutes: (data.totalPomodoros || 0) * 25,
            earlyBird: data.earlyBird || false,
            nightOwl: data.nightOwl || false,
            weekendPomos: data.weekendPomos || 0,
            estimationAccuracy: TaskEstimation.getAccuracy() || 0
        };
    },

    // Get unlocked achievements
    getUnlocked() {
        const unlocked = JSON.parse(localStorage.getItem('achievements_unlocked') || '[]');
        return unlocked;
    },

    // Check for new achievements
    checkAchievements() {
        const stats = this.getStats();
        const unlocked = this.getUnlocked();
        const newAchievements = [];

        this.achievements.forEach(achievement => {
            if (!unlocked.includes(achievement.id) && achievement.condition(stats)) {
                unlocked.push(achievement.id);
                newAchievements.push(achievement);
            }
        });

        if (newAchievements.length > 0) {
            localStorage.setItem('achievements_unlocked', JSON.stringify(unlocked));
            newAchievements.forEach(a => this.showUnlockNotification(a));
        }

        return newAchievements;
    },

    // Show achievement unlock notification
    showUnlockNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <div class="achievement-title">Rozet Kazanıldı!</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
            </div>
        `;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 5000);

        // Play sound if available
        if (window.showNotification) {
            window.showNotification('🏆 Rozet Kazanıldı!', achievement.name);
        }
    },

    // Render achievements page/modal
    renderAchievementsUI() {
        const stats = this.getStats();
        const unlocked = this.getUnlocked();

        let html = '<div class="achievements-grid">';

        this.achievements.forEach(achievement => {
            const isUnlocked = unlocked.includes(achievement.id);
            html += `
                <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">${isUnlocked ? achievement.icon : '🔒'}</div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.description}</div>
                </div>
            `;
        });

        html += '</div>';
        html += `<div class="achievements-summary">
            <span>${unlocked.length}/${this.achievements.length} rozet kazanıldı</span>
        </div>`;

        return html;
    }
};

// ===== 4. DAILY CHALLENGES SYSTEM =====
const DailyChallenges = {
    challenges: [
        { id: 'complete_5', type: 'pomodoro', target: 5, name: '5 Pomodoro Tamamla', reward: 50, icon: '⏱' },
        { id: 'complete_8', type: 'pomodoro', target: 8, name: '8 Pomodoro Tamamla', reward: 100, icon: '⏱' },
        { id: 'complete_10', type: 'pomodoro', target: 10, name: '10 Pomodoro Tamamla', reward: 150, icon: '🔥' },
        { id: 'task_3', type: 'task', target: 3, name: '3 Görev Tamamla', reward: 75, icon: '✅' },
        { id: 'task_5', type: 'task', target: 5, name: '5 Görev Tamamla', reward: 125, icon: '📋' },
        { id: 'focus_2h', type: 'focus_time', target: 120, name: '2 Saat Odaklan', reward: 100, icon: '⏰' },
        { id: 'focus_4h', type: 'focus_time', target: 240, name: '4 Saat Odaklan', reward: 200, icon: '⏱️' },
        { id: 'no_skip', type: 'no_skip', target: 5, name: '5 Pomodoro Atlamadan Tamamla', reward: 100, icon: '💪' },
        { id: 'morning_3', type: 'morning', target: 3, name: 'Sabah 10\'dan Önce 3 Pomodoro', reward: 100, icon: '🌅' },
        { id: 'streak_keep', type: 'streak', target: 1, name: 'Serini Koru', reward: 50, icon: '🔥' },
    ],

    // Get today's challenges (3 random)
    getTodayChallenges() {
        const today = new Date().toDateString();
        const stored = localStorage.getItem('daily_challenges');
        const data = stored ? JSON.parse(stored) : null;

        // Return existing if same day
        if (data && data.date === today) {
            return data.challenges;
        }

        // Generate new challenges for today
        const shuffled = [...this.challenges].sort(() => Math.random() - 0.5);
        const todayChallenges = shuffled.slice(0, 3).map(c => ({
            ...c,
            progress: 0,
            completed: false,
            claimed: false
        }));

        localStorage.setItem('daily_challenges', JSON.stringify({
            date: today,
            challenges: todayChallenges
        }));

        return todayChallenges;
    },

    // Update challenge progress
    updateProgress(type, amount = 1) {
        const data = JSON.parse(localStorage.getItem('daily_challenges') || '{}');
        if (!data.challenges) return;

        let updated = false;
        data.challenges.forEach(challenge => {
            if (challenge.type === type && !challenge.completed) {
                challenge.progress = Math.min(challenge.progress + amount, challenge.target);
                if (challenge.progress >= challenge.target) {
                    challenge.completed = true;
                    updated = true;
                }
            }
        });

        localStorage.setItem('daily_challenges', JSON.stringify(data));

        if (updated) {
            this.checkCompletions();
        }

        return data.challenges;
    },

    // Check and notify completions
    checkCompletions() {
        const challenges = this.getTodayChallenges();
        challenges.forEach(c => {
            if (c.completed && !c.claimed) {
                this.showCompletionNotification(c);
            }
        });
    },

    // Show completion notification
    showCompletionNotification(challenge) {
        if (window.showNotification) {
            window.showNotification(
                '🎯 Meydan Okuma Tamamlandı!',
                `${challenge.name} - ${challenge.reward} XP kazandın!`
            );
        }
    },

    // Claim reward
    claimReward(challengeId) {
        const data = JSON.parse(localStorage.getItem('daily_challenges') || '{}');
        const challenge = data.challenges?.find(c => c.id === challengeId);

        if (challenge && challenge.completed && !challenge.claimed) {
            challenge.claimed = true;
            localStorage.setItem('daily_challenges', JSON.stringify(data));

            // Add XP
            if (typeof dataManager !== 'undefined') {
                dataManager.addXP(challenge.reward);
                if (typeof updateGamificationUI === 'function') {
                    updateGamificationUI();
                }
            }

            return true;
        }
        return false;
    },

    // Render challenges UI
    renderChallengesUI() {
        const challenges = this.getTodayChallenges();
        const now = new Date();
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        const timeLeft = endOfDay - now;
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

        let html = `
            <div class="challenges-header">
                <h3>🎯 Günlük Meydan Okumalar</h3>
                <div class="challenges-timer">⏳ ${hoursLeft}s ${minutesLeft}dk kaldı</div>
            </div>
            <p class="challenges-subtitle">Her gün 3 farklı meydan okuma (uygulama tarafından rastgele seçilir)</p>
            <div class="challenges-list">
        `;

        challenges.forEach(c => {
            const percentage = Math.round((c.progress / c.target) * 100);
            const def = this.challenges.find(d => d.id === c.id);
            const icon = (def && def.icon) ? def.icon : (String(c.icon) === '⚡' ? '⏱' : (c.icon || '⏱'));
            html += `
                <div class="challenge-item ${c.completed ? 'completed' : ''} ${c.claimed ? 'claimed' : ''}">
                    <div class="challenge-icon">${icon}</div>
                    <div class="challenge-info">
                        <div class="challenge-name">${c.name}</div>
                        <div class="challenge-progress-bar">
                            <div class="challenge-progress-fill" style="width: ${percentage}%"></div>
                        </div>
                        <div class="challenge-progress-text">${c.progress}/${c.target}</div>
                    </div>
                    <div class="challenge-reward">
                        ${c.claimed ? '✅' : c.completed ?
                    `<button class="claim-btn" onclick="DailyChallenges.claimReward('${c.id}'); this.closest('.challenge-item').classList.add('claimed'); this.textContent='✅';">
                                ${c.reward} XP
                            </button>` :
                    `<span class="reward-pending">${c.reward} XP</span>`
                }
                    </div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }
};

// ===== 5. SOUND PREVIEW SYSTEM =====
const SoundPreview = {
    previewAudio: null,

    init() {
        this.previewAudio = new Audio();
        this.previewAudio.volume = 0.5;
    },

    preview(soundPath, duration = 2000) {
        if (this.previewAudio) {
            this.previewAudio.pause();
            this.previewAudio.currentTime = 0;
        }

        this.previewAudio.src = soundPath;
        this.previewAudio.play().catch(e => console.warn('Preview failed:', e));

        // Stop after duration
        setTimeout(() => {
            if (this.previewAudio) {
                this.previewAudio.pause();
                this.previewAudio.currentTime = 0;
            }
        }, duration);
    },

    stop() {
        if (this.previewAudio) {
            this.previewAudio.pause();
            this.previewAudio.currentTime = 0;
        }
    },

    // Render sound selector with preview
    renderSoundSelector(sounds, currentSound, inputId) {
        let html = '<div class="sound-selector">';

        sounds.forEach(sound => {
            const isActive = currentSound === sound.path;
            html += `
                <div class="sound-option ${isActive ? 'active' : ''}" data-sound="${sound.path}">
                    <span class="sound-name">${sound.name}</span>
                    <button class="preview-btn" onclick="event.stopPropagation(); SoundPreview.preview('${sound.path}')" title="Önizle">
                        🔊
                    </button>
                    <input type="radio" name="${inputId}" value="${sound.path}" ${isActive ? 'checked' : ''} style="display:none;">
                </div>
            `;
        });

        html += '</div>';
        return html;
    }
};

// ===== 6. EMPTY STATES =====
const EmptyStates = {
    states: {
        tasks: {
            icon: '📝',
            title: 'Henüz görev yok',
            description: 'İlk görevini ekleyerek başla!',
            action: { text: '+ Görev Ekle', dataAction: 'add-task' }
        },
        notes: {
            icon: '💭',
            title: 'Brain dump boş',
            description: 'Aklına gelenleri buraya yaz',
            action: { text: '+ Not Ekle', dataAction: 'focus-note-input' }
        },
        history: {
            icon: '📊',
            title: 'Henüz pomodoro yok',
            description: 'İlk pomodoronu tamamla ve istatistiklerini gör',
            action: { text: 'Başla', dataAction: 'start-timer' }
        },
        achievements: {
            icon: '🏆',
            title: 'Rozetler bekleniyor',
            description: 'Pomodoro tamamlayarak rozetler kazan!',
            action: null
        }
    },

    render(type) {
        const state = this.states[type];
        if (!state) return '';

        return `
            <div class="empty-state">
                <div class="empty-icon">${state.icon}</div>
                <div class="empty-title">${state.title}</div>
                <div class="empty-description">${state.description}</div>
                ${state.action ? `
                    <button type="button" class="empty-action-btn" data-empty-action="${state.action.dataAction || ''}" ${state.action.onclick ? 'onclick="' + state.action.onclick.replace(/"/g, '&quot;') + '"' : ''}>
                        ${state.action.text}
                    </button>
                ` : ''}
            </div>
        `;
    }
};

// ===== 7. LOADING STATES =====
const LoadingStates = {
    show(containerId, type = 'spinner') {
        const container = document.getElementById(containerId);
        if (!container) return;

        let html = '';
        switch (type) {
            case 'spinner':
                html = '<div class="loading-spinner"><div class="spinner"></div></div>';
                break;
            case 'skeleton':
                html = `
                    <div class="loading-skeleton">
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line short"></div>
                        <div class="skeleton-line"></div>
                    </div>
                `;
                break;
            case 'dots':
                html = '<div class="loading-dots"><span></span><span></span><span></span></div>';
                break;
        }

        container.innerHTML = html;
    },

    hide(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
        }
    }
};

// ===== 8. PDF/EXCEL EXPORT =====
const ReportExporter = {
    // Generate PDF report (using browser print)
    exportPDF() {
        const stats = this.getReportData();
        const html = this.generateReportHTML(stats);

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Pomodev Raporu - ${new Date().toLocaleDateString('tr-TR')}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                    h1 { color: #4da3ff; border-bottom: 2px solid #4da3ff; padding-bottom: 10px; }
                    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
                    .stat-card { background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; }
                    .stat-value { font-size: 2rem; font-weight: bold; color: #333; }
                    .stat-label { color: #666; margin-top: 5px; }
                    .section { margin: 30px 0; }
                    .section h2 { color: #333; border-left: 4px solid #4da3ff; padding-left: 10px; }
                    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background: #f0f0f0; }
                    .footer { margin-top: 40px; text-align: center; color: #999; font-size: 0.9rem; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                ${html}
                <button class="no-print" onclick="window.print(); window.close();" 
                    style="position:fixed;bottom:20px;right:20px;padding:10px 20px;background:#4da3ff;color:white;border:none;border-radius:8px;cursor:pointer;">
                    PDF Olarak Kaydet
                </button>
            </body>
            </html>
        `);
        printWindow.document.close();
    },

    // Export to CSV (Excel compatible)
    exportCSV() {
        const history = JSON.parse(localStorage.getItem('pomodoroHistory') || '[]');
        const tasks = JSON.parse(localStorage.getItem('pomodev_tasks') || '[]');

        // Pomodoro history CSV
        let csv = 'Tarih,Saat,Süre (dk),Mod,Görev\n';
        history.forEach(entry => {
            const date = new Date(entry.timestamp);
            csv += `${date.toLocaleDateString('tr-TR')},${date.toLocaleTimeString('tr-TR')},${entry.duration || 25},${entry.mode || 'pomodoro'},${(entry.task || '').replace(/,/g, ';')}\n`;
        });

        this.downloadFile(csv, 'pomodev_pomodoro_gecmisi.csv', 'text/csv');

        // Tasks CSV
        let tasksCsv = 'Görev,Proje,Tahmini Pomo,Gerçek Pomo,Durum,Oluşturulma\n';
        tasks.forEach(task => {
            tasksCsv += `${(task.text || '').replace(/,/g, ';')},${task.project || 'Genel'},${task.estimatedPomos || '-'},${task.actualPomos || '-'},${task.completed ? 'Tamamlandı' : 'Devam'},${task.createdAt || '-'}\n`;
        });

        this.downloadFile(tasksCsv, 'pomodev_gorevler.csv', 'text/csv');

        if (window.showNotification) {
            window.showNotification('📥 Dışa Aktarıldı', '2 dosya indirildi');
        }
    },

    // Helper: Download file
    downloadFile(content, filename, mimeType) {
        const blob = new Blob(['\ufeff' + content], { type: mimeType + ';charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Get report data
    getReportData() {
        const data = JSON.parse(localStorage.getItem('pomodevData') || '{}');
        const history = JSON.parse(localStorage.getItem('pomodoroHistory') || '[]');
        const tasks = JSON.parse(localStorage.getItem('pomodev_tasks') || '[]');

        // Calculate weekly data
        const now = new Date();
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const weekHistory = history.filter(h => new Date(h.timestamp) > weekAgo);

        // Daily breakdown
        const dailyData = {};
        weekHistory.forEach(h => {
            const day = new Date(h.timestamp).toLocaleDateString('tr-TR');
            dailyData[day] = (dailyData[day] || 0) + 1;
        });

        return {
            totalPomodoros: history.length,
            totalMinutes: history.length * 25,
            totalHours: Math.round(history.length * 25 / 60 * 10) / 10,
            weekPomodoros: weekHistory.length,
            weekMinutes: weekHistory.length * 25,
            currentStreak: parseInt(localStorage.getItem('currentStreak') || '0'),
            tasksTotal: tasks.length,
            tasksCompleted: tasks.filter(t => t.completed).length,
            dailyData: dailyData,
            achievementsUnlocked: AchievementSystem.getUnlocked().length,
            achievementsTotal: AchievementSystem.achievements.length
        };
    },

    // Generate HTML report
    generateReportHTML(stats) {
        return `
            <h1>⏱ Pomodev Verimlilik Raporu</h1>
            <p>Oluşturulma: ${new Date().toLocaleString('tr-TR')}</p>
            
            <div class="stat-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.totalPomodoros}</div>
                    <div class="stat-label">Toplam Pomodoro</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.totalHours}s</div>
                    <div class="stat-label">Toplam Odaklanma</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.currentStreak}</div>
                    <div class="stat-label">Günlük Seri</div>
                </div>
            </div>
            
            <div class="section">
                <h2>📅 Bu Hafta</h2>
                <div class="stat-grid">
                    <div class="stat-card">
                        <div class="stat-value">${stats.weekPomodoros}</div>
                        <div class="stat-label">Pomodoro</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${Math.round(stats.weekMinutes / 60 * 10) / 10}s</div>
                        <div class="stat-label">Odaklanma</div>
                    </div>
                </div>
                
                <table>
                    <tr><th>Gün</th><th>Pomodoro</th></tr>
                    ${Object.entries(stats.dailyData).map(([day, count]) =>
            `<tr><td>${day}</td><td>${count} ⏱</td></tr>`
        ).join('')}
                </table>
            </div>
            
            <div class="section">
                <h2>✅ Görevler</h2>
                <p>${stats.tasksCompleted}/${stats.tasksTotal} görev tamamlandı</p>
            </div>
            
            <div class="section">
                <h2>🏆 Rozetler</h2>
                <p>${stats.achievementsUnlocked}/${stats.achievementsTotal} rozet kazanıldı</p>
            </div>
            
            <div class="footer">
                <p>Bu rapor Pomodev tarafından oluşturuldu</p>
                <p>pomodev-omega.vercel.app</p>
            </div>
        `;
    }
};

// ===== INITIALIZE ALL FEATURES =====
function initializeFeatures() {
    // Initialize sound preview
    SoundPreview.init();

    // Initialize visual counter
    PomodoroVisualCounter.init();

    // Initialize daily challenges
    const challengesContainer = document.getElementById('dailyChallengesContainer');
    if (challengesContainer) {
        challengesContainer.innerHTML = DailyChallenges.renderChallengesUI();
        // Refresh challenges timer every minute
        setInterval(() => {
            const container = document.getElementById('dailyChallengesContainer');
            if (container) {
                container.innerHTML = DailyChallenges.renderChallengesUI();
            }
        }, 60000);
    }

    // Check achievements on load
    setTimeout(() => AchievementSystem.checkAchievements(), 2000);

    // Make all modules globally available
    window.PomodoroVisualCounter = PomodoroVisualCounter;
    window.TaskEstimation = TaskEstimation;
    window.AchievementSystem = AchievementSystem;
    window.DailyChallenges = DailyChallenges;
    window.SoundPreview = SoundPreview;
    window.EmptyStates = EmptyStates;
    window.LoadingStates = LoadingStates;
    window.ReportExporter = ReportExporter;
}

// Run on DOMContentLoaded or immediately if already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFeatures);
} else {
    initializeFeatures();
}

// Listen for pomodoro completion to update challenges
window.addEventListener('pomodoroComplete', (e) => {
    DailyChallenges.updateProgress('pomodoro', 1);

    const now = new Date();
    const hour = now.getHours();

    // Check morning challenge
    if (hour < 10) {
        DailyChallenges.updateProgress('morning', 1);
    }

    // Check focus time
    DailyChallenges.updateProgress('focus_time', 25);

    // Update visual counter
    PomodoroVisualCounter.render();

    // Check achievements
    AchievementSystem.checkAchievements();
});

// Listen for task completion
window.addEventListener('taskComplete', () => {
    DailyChallenges.updateProgress('task', 1);
    AchievementSystem.checkAchievements();
});
