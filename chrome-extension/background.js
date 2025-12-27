// Pomodev Chrome Extension - Background Service Worker

// Handle alarms for timer
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'pomodevTimer') {
        handleTimerComplete();
    }
});

async function handleTimerComplete() {
    const data = await chrome.storage.local.get(['currentMode', 'todayPomodoros']);
    const currentMode = data.currentMode || 'pomodoro';
    let todayPomodoros = data.todayPomodoros || 0;

    if (currentMode === 'pomodoro') {
        todayPomodoros++;

        await chrome.storage.local.set({ todayPomodoros });

        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: '🍅 Pomodoro Tamamlandı!',
            message: `Harika! ${todayPomodoros}. pomodoro'nu tamamladın. +100 XP!`,
            priority: 2
        });
    } else {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: '⏰ Mola Bitti!',
            message: 'Odaklanma zamanı geldi!',
            priority: 2
        });
    }
}

// Reset daily stats at midnight
chrome.alarms.create('dailyReset', {
    when: getNextMidnight(),
    periodInMinutes: 24 * 60
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'dailyReset') {
        chrome.storage.local.set({ todayPomodoros: 0 });
    }
});

function getNextMidnight() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
}

// Handle extension install
chrome.runtime.onInstalled.addListener(() => {
    console.log('Pomodev Extension installed!');

    // Initialize default values
    chrome.storage.local.set({
        todayPomodoros: 0,
        weekPomodoros: 0,
        currentStreak: 0,
        xp: 0,
        level: 1,
        currentMode: 'pomodoro',
        remainingTime: 25 * 60
    });
});
