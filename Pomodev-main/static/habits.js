/**
 * Habit Tracking System for Pomodev
 * Track daily habits and maintain streaks
 */

class HabitTracker {
    constructor() {
        this.storageKey = 'pomodev_habits';
        this.habits = this.loadHabits();
    }

    loadHabits() {
        const saved = localStorage.getItem(this.storageKey);
        return saved ? JSON.parse(saved) : [];
    }

    saveHabits() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.habits));
    }

    // Add a new habit
    addHabit(name, icon = '✅') {
        const habit = {
            id: Date.now(),
            name: name,
            icon: icon,
            createdAt: new Date().toISOString(),
            completions: [],
            currentStreak: 0,
            longestStreak: 0,
            lastCompleted: null
        };

        this.habits.push(habit);
        this.saveHabits();
        return habit;
    }

    // Complete a habit for today
    completeHabit(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return false;

        const today = new Date().toDateString();
        const todayCompletion = habit.completions.find(c => new Date(c.date).toDateString() === today);

        if (todayCompletion) {
            // Already completed today
            return false;
        }

        // Add completion
        habit.completions.push({
            date: new Date().toISOString()
        });
        habit.lastCompleted = new Date().toISOString();

        // Update streak
        this.updateStreak(habit);

        this.saveHabits();
        return true;
    }

    // Uncomplete a habit for today
    uncompleteHabit(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return false;

        const today = new Date().toDateString();
        const index = habit.completions.findIndex(c => new Date(c.date).toDateString() === today);

        if (index === -1) return false;

        habit.completions.splice(index, 1);
        this.updateStreak(habit);
        this.saveHabits();
        return true;
    }

    // Update streak for a habit
    updateStreak(habit) {
        if (habit.completions.length === 0) {
            habit.currentStreak = 0;
            return;
        }

        // Sort completions by date
        const sorted = habit.completions
            .map(c => new Date(c.date))
            .sort((a, b) => b - a);

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (const completionDate of sorted) {
            const compDate = new Date(completionDate);
            compDate.setHours(0, 0, 0, 0);

            const diffDays = Math.floor((currentDate - compDate) / (1000 * 60 * 60 * 24));

            if (diffDays === streak) {
                streak++;
            } else if (diffDays > streak) {
                break;
            }
        }

        habit.currentStreak = streak;
        if (streak > habit.longestStreak) {
            habit.longestStreak = streak;
        }
    }

    // Delete a habit
    deleteHabit(habitId) {
        this.habits = this.habits.filter(h => h.id !== habitId);
        this.saveHabits();
    }

    // Get all habits
    getHabits() {
        return this.habits;
    }

    // Get habit by ID
    getHabit(habitId) {
        return this.habits.find(h => h.id === habitId);
    }

    // Check if habit is completed today
    isCompletedToday(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return false;

        const today = new Date().toDateString();
        return habit.completions.some(c => new Date(c.date).toDateString() === today);
    }

    // Get completion rate for a habit (last 30 days)
    getCompletionRate(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return 0;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentCompletions = habit.completions.filter(c =>
            new Date(c.date) >= thirtyDaysAgo
        );

        return Math.round((recentCompletions.length / 30) * 100);
    }

    // Update all streaks (call this daily)
    updateAllStreaks() {
        this.habits.forEach(habit => this.updateStreak(habit));
        this.saveHabits();
    }
}

// Global instance
const habitTracker = new HabitTracker();

// Setup habits UI - Disabled for cleaner interface
function setupHabitsUI() {
    // Habits feature temporarily disabled to keep UI clean
    // Can be re-enabled when needed
    return;
}

function renderHabits() {
    const habitsList = document.getElementById('habitsList');
    const emptyState = document.getElementById('habitsEmpty');

    if (!habitsList || !emptyState) return;

    const habits = habitTracker.getHabits();

    if (habits.length === 0) {
        habitsList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    habitsList.style.display = 'block';
    emptyState.style.display = 'none';
    
    // Sanitize function for XSS prevention
    const sanitize = str => (str || '').replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));
    
    habitsList.innerHTML = habits.map(habit => {
        const isCompleted = habitTracker.isCompletedToday(habit.id);
        const completionRate = habitTracker.getCompletionRate(habit.id);
        
        // Sanitize user input
        const safeIcon = sanitize(habit.icon);
        const safeName = sanitize(habit.name);
        const safeId = parseInt(habit.id) || 0;
        const safeStreak = parseInt(habit.currentStreak) || 0;

        return `
            <div class="habit-item ${isCompleted ? 'completed' : ''}" data-habit-id="${safeId}">
                <div class="habit-content">
                    <button class="habit-checkbox ${isCompleted ? 'checked' : ''}" onclick="toggleHabit(${safeId})">
                        ${isCompleted ? '✅' : '⭕'}
                    </button>
                    <div class="habit-info">
                        <div class="habit-name">${safeIcon} ${safeName}</div>
                        <div class="habit-stats">
                            <span>🔥 ${safeStreak} gün</span>
                            <span>📊 ${completionRate}% (30 gün)</span>
                        </div>
                    </div>
                </div>
                <button class="habit-delete" onclick="deleteHabit(${safeId})" title="Sil">🗑️</button>
            </div>
        `;
    }).join('');
}

function showAddHabitModal() {
    const modal = document.getElementById('addHabitModal');
    const nameInput = document.getElementById('habitNameInput');
    const iconInput = document.getElementById('habitIconInput');

    if (modal && nameInput) {
        modal.classList.remove('hidden');
        nameInput.value = '';
        if (iconInput) iconInput.value = '';
        setTimeout(() => nameInput.focus(), 100);

        // Disable body scroll
        document.body.style.overflow = 'hidden';
    }
}

function closeHabitModal() {
    const modal = document.getElementById('addHabitModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function setHabitIcon(icon) {
    const iconInput = document.getElementById('habitIconInput');
    if (iconInput) {
        iconInput.value = icon;
    }
}

function saveHabitFromModal() {
    const nameInput = document.getElementById('habitNameInput');
    const iconInput = document.getElementById('habitIconInput');

    const name = nameInput.value.trim();
    const icon = iconInput.value.trim() || '✅'; // Default icon

    if (!name) {
        alert("Lütfen bir alışkanlık adı girin.");
        return;
    }

    habitTracker.addHabit(name, icon);
    renderHabits();
    showNotification('✅ Alışkanlık eklendi', name);
    closeHabitModal();
}

// Bind save button
document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('saveHabitBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveHabitFromModal);
    }

    // Allow Enter key to save
    const nameInput = document.getElementById('habitNameInput');
    if (nameInput) {
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') saveHabitFromModal();
        });
    }
});

// Expose checks
window.closeHabitModal = closeHabitModal;
window.setHabitIcon = setHabitIcon;
window.showAddHabitModal = showAddHabitModal;

function toggleHabit(habitId) {
    const isCompleted = habitTracker.isCompletedToday(habitId);

    if (isCompleted) {
        habitTracker.uncompleteHabit(habitId);
    } else {
        habitTracker.completeHabit(habitId);
        showNotification('✅ Alışkanlık tamamlandı!', '');
    }

    renderHabits();

    // Update streak display
    const habit = habitTracker.getHabit(habitId);
    if (habit && habit.currentStreak > 0) {
        // Show streak notification
        if (habit.currentStreak % 7 === 0) {
            showNotification(`🔥 ${habit.currentStreak} günlük streak!`, 'Harika gidiyorsun!');
        }
    }
}

function deleteHabit(habitId) {
    const habit = habitTracker.getHabit(habitId);
    if (!habit) return;

    if (confirm(`"${habit.name}" alışkanlığını silmek istediğinize emin misiniz?`)) {
        habitTracker.deleteHabit(habitId);
        renderHabits();
        showNotification('🗑️ Alışkanlık silindi', '');
    }
}

// Make functions globally available
window.toggleHabit = toggleHabit;
window.deleteHabit = deleteHabit;
window.habitTracker = habitTracker;

// Update streaks daily
function updateDailyStreaks() {
    const lastUpdate = localStorage.getItem('habits_last_update');
    const today = new Date().toDateString();

    if (lastUpdate !== today) {
        habitTracker.updateAllStreaks();
        localStorage.setItem('habits_last_update', today);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(setupHabitsUI, 2000);
    updateDailyStreaks();

    // Re-render habits periodically
    setInterval(() => {
        if (document.getElementById('habitsList')) {
            renderHabits();
        }
    }, 60000); // Every minute
});

// Add CSS for habits
const habitsCSS = `
.habits-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 10px;
}

.habit-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
    background: rgba(255,255,255,0.03);
    border-radius: 8px;
    transition: all 0.2s;
}

.habit-item:hover {
    background: rgba(255,255,255,0.05);
}

.habit-item.completed {
    opacity: 0.7;
}

.habit-content {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
}

.habit-checkbox {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 1.2em;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.habit-info {
    flex: 1;
}

.habit-name {
    font-weight: 500;
    margin-bottom: 4px;
}

.habit-stats {
    display: flex;
    gap: 15px;
    font-size: 0.85em;
    color: rgba(255,255,255,0.6);
}

.habit-delete {
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 1em;
    opacity: 0.5;
    transition: opacity 0.2s;
    padding: 5px;
}

.habit-delete:hover {
    opacity: 1;
}
`;

// Inject CSS (global 'style' çakışmasını önlemek için habitStyleEl)
const habitStyleEl = document.createElement('style');
habitStyleEl.textContent = habitsCSS;
document.head.appendChild(habitStyleEl);
