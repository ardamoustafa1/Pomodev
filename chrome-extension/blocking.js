/**
 * Website/App Blocking for Pomodev Chrome Extension
 * Blocks distracting websites during pomodoro sessions
 */

// Default block list (common distracting sites)
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

// Load block list from storage
async function loadBlockList() {
    const result = await chrome.storage.sync.get(['blockList', 'blockingEnabled']);
    return {
        list: result.blockList || DEFAULT_BLOCK_LIST,
        enabled: result.blockingEnabled !== false // Default to true
    };
}

// Save block list
async function saveBlockList(list, enabled) {
    await chrome.storage.sync.set({
        blockList: list,
        blockingEnabled: enabled
    });
    await updateBlockingRules();
}

// Update blocking rules
async function updateBlockingRules() {
    const { list, enabled } = await loadBlockList();
    
    // Remove existing rules
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    if (existingRules.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: existingRules.map(r => r.id)
        });
    }
    
    if (!enabled) return;
    
    // Add new rules
    const rules = list.map((pattern, index) => ({
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

// Check if timer is running
async function isTimerRunning() {
    const result = await chrome.storage.local.get(['isRunning', 'currentMode']);
    return result.isRunning === true && result.currentMode === 'pomodoro';
}

// Enable blocking when timer starts
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.isRunning) {
        const isRunning = changes.isRunning.newValue;
        const currentMode = changes.currentMode?.newValue || 'pomodoro';
        
        if (isRunning && currentMode === 'pomodoro') {
            // Timer started - enable blocking
            loadBlockList().then(({ enabled }) => {
                if (enabled) {
                    updateBlockingRules();
                }
            });
        } else {
            // Timer stopped - disable blocking
            chrome.declarativeNetRequest.getDynamicRules().then(rules => {
                if (rules.length > 0) {
                    chrome.declarativeNetRequest.updateDynamicRules({
                        removeRuleIds: rules.map(r => r.id)
                    });
                }
            });
        }
    }
});

// Initialize blocking rules
chrome.runtime.onInstalled.addListener(() => {
    updateBlockingRules();
});

// Listen for tab updates to show blocking notification
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading' && tab.url) {
        const { list, enabled } = await loadBlockList();
        const isRunning = await isTimerRunning();
        
        if (enabled && isRunning) {
            const isBlocked = list.some(pattern => {
                const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                return regex.test(tab.url);
            });
            
            if (isBlocked) {
                chrome.tabs.update(tabId, {
                    url: chrome.runtime.getURL('blocked.html')
                });
            }
        }
    }
});

// Export functions for popup
if (typeof window !== 'undefined') {
    window.loadBlockList = loadBlockList;
    window.saveBlockList = saveBlockList;
    window.updateBlockingRules = updateBlockingRules;
}
