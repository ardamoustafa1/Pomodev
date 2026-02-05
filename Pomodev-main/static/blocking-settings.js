/**
 * Website Blocking Settings UI
 * Add blocking management to settings modal
 */

// Setup blocking settings - DISABLED: Feature works via Chrome Extension only
function setupBlockingSettings() {
    // Blocking settings now managed via Chrome Extension popup
    // No longer adding dynamic sections to avoid UI clutter
    return;
}

function loadBlockListSettings() {
    // Load from localStorage (Chrome extension will sync)
    const saved = localStorage.getItem('pomodev_blockList');
    const enabled = localStorage.getItem('pomodev_blockingEnabled') !== 'false';
    
    const textarea = document.getElementById('blockListTextarea');
    const checkbox = document.getElementById('blockingEnabled');
    
    if (textarea && saved) {
        textarea.value = JSON.parse(saved).join('\n');
    } else if (textarea) {
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

function saveBlockList() {
    const textarea = document.getElementById('blockListTextarea');
    const checkbox = document.getElementById('blockingEnabled');
    
    if (!textarea || !checkbox) return;
    
    const sites = textarea.value
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => {
            // Convert to blocking pattern
            if (!s.includes('*')) {
                return `*://*.${s}/*`;
            }
            return s;
        });
    
    localStorage.setItem('pomodev_blockList', JSON.stringify(sites));
    localStorage.setItem('pomodev_blockingEnabled', checkbox.checked.toString());
    
    // Send to Chrome extension if available
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({
            action: 'updateBlockList',
            list: sites,
            enabled: checkbox.checked
        });
    }
    
    showNotification('✅ Blocking List Kaydedildi', 'Ayarlar Chrome Extension\'a gönderildi');
}

function resetBlockList() {
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
}

// Make functions globally available
window.saveBlockList = saveBlockList;
window.resetBlockList = resetBlockList;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(setupBlockingSettings, 1500); // Wait for settings modal to be ready
});
