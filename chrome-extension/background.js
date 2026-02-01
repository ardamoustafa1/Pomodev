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
            title: '⏱ Pomodoro Tamamlandı!',
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
    
    // Initialize blocking
    initializeBlocking();
});

// Website blocking functionality
const DEFAULT_BLOCK_LIST = [
    '*://*.facebook.com/*',
    '*://*.twitter.com/*',
    '*://*.instagram.com/*',
    '*://*.youtube.com/*',
    '*://*.reddit.com/*',
    '*://*.tiktok.com/*',
    '*://*.netflix.com/*',
    '*://*.twitch.tv/*'
];

async function initializeBlocking() {
    const result = await chrome.storage.sync.get(['blockList', 'blockingEnabled']);
    const blockList = result.blockList || DEFAULT_BLOCK_LIST;
    const enabled = result.blockingEnabled !== false;
    
    if (enabled) {
        await updateBlockingRules(blockList);
    }
}

async function updateBlockingRules(blockList) {
    // Remove existing rules
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    if (existingRules.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: existingRules.map(r => r.id)
        });
    }
    
    // Add new rules
    const rules = blockList.map((pattern, index) => ({
        id: index + 1,
        priority: 1,
        action: {
            type: 'block'
        },
        condition: {
            urlFilter: pattern,
            resourceTypes: ['main_frame', 'sub_frame']
        }
    }));
    
    if (rules.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
            addRules: rules
        });
    }
}

// Listen for timer state changes
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.isRunning) {
        const isRunning = changes.isRunning.newValue;
        const currentMode = changes.currentMode?.newValue || 'pomodoro';
        
        chrome.storage.sync.get(['blockingEnabled']).then(({ blockingEnabled }) => {
            if (blockingEnabled !== false && isRunning && currentMode === 'pomodoro') {
                chrome.storage.sync.get(['blockList']).then(({ blockList }) => {
                    updateBlockingRules(blockList || DEFAULT_BLOCK_LIST);
                });
            } else {
                chrome.declarativeNetRequest.getDynamicRules().then(rules => {
                    if (rules.length > 0) {
                        chrome.declarativeNetRequest.updateDynamicRules({
                            removeRuleIds: rules.map(r => r.id)
                        });
                    }
                });
            }
        });
    }
});

// Handle messages from popup/settings
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateBlockList') {
        chrome.storage.sync.set({
            blockList: message.list,
            blockingEnabled: message.enabled
        }).then(() => {
            if (message.enabled) {
                updateBlockingRules(message.list);
            } else {
                chrome.declarativeNetRequest.getDynamicRules().then(rules => {
                    if (rules.length > 0) {
                        chrome.declarativeNetRequest.updateDynamicRules({
                            removeRuleIds: rules.map(r => r.id)
                        });
                    }
                });
            }
        });
        sendResponse({ success: true });
    }
    return true;
});
