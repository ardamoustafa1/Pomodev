/**
 * Google Calendar Integration for Pomodev
 * Allows users to sync pomodoro sessions to Google Calendar
 */

class CalendarManager {
    constructor() {
        this.clientId = null; // Will be set from backend/config
        this.accessToken = null;
        this.isAuthorized = false;
    }

    // Initialize Google Calendar API
    async init() {
        // Check if user has authorized
        const savedToken = localStorage.getItem('google_calendar_token');
        if (savedToken) {
            this.accessToken = savedToken;
            this.isAuthorized = true;
        }
        
        // Load client ID from backend or use default
        try {
            const response = await fetch('/api/calendar/config');
            const data = await response.json();
            if (data.success && data.data.clientId) {
                this.clientId = data.data.clientId;
            }
        } catch (e) {
            console.log('Calendar config not available, using manual auth');
        }
    }

    // Client ID yoksa OAuth penceresi açılmaz; token ile bağlan kullanılır
    setTokenManually(token) {
        if (!token || !token.trim()) return false;
        const t = token.trim();
        this.accessToken = t;
        this.isAuthorized = true;
        localStorage.setItem('google_calendar_token', t);
        return true;
    }

    // Authorize with Google Calendar (OAuth popup veya callback ile)
    async authorize() {
        const redirectUri = window.location.origin + '/calendar/callback';
        const scope = 'https://www.googleapis.com/auth/calendar.events';
        const hasClientId = this.clientId && this.clientId !== 'YOUR_CLIENT_ID';

        if (!hasClientId) {
            return Promise.reject(new Error('Google Calendar Client ID ayarlı değil. "Token ile bağlan" kullanın.'));
        }

        return new Promise((resolve, reject) => {
            const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' +
                'client_id=' + encodeURIComponent(this.clientId) + '&' +
                'redirect_uri=' + encodeURIComponent(redirectUri) + '&' +
                'response_type=token&' +
                'scope=' + encodeURIComponent(scope);
            
            const popup = window.open(authUrl, 'Google Calendar Auth', 'width=500,height=600');
            if (!popup) {
                reject(new Error('Popup engellendi. Tarayıcıda açılır pencerelere izin verin veya "Token ile bağlan" kullanın.'));
                return;
            }

            const messageListener = (event) => {
                if (event.origin !== window.location.origin) return;
                if (event.data.type === 'google_calendar_token') {
                    this.accessToken = event.data.token;
                    localStorage.setItem('google_calendar_token', this.accessToken);
                    this.isAuthorized = true;
                    window.removeEventListener('message', messageListener);
                    try { popup.close(); } catch (_) {}
                    resolve(this.accessToken);
                } else if (event.data.type === 'google_calendar_error') {
                    window.removeEventListener('message', messageListener);
                    try { popup.close(); } catch (_) {}
                    reject(new Error(event.data.error || 'Giriş iptal edildi'));
                }
            };
            window.addEventListener('message', messageListener);

            const checkClosed = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkClosed);
                    window.removeEventListener('message', messageListener);
                    if (!this.isAuthorized) reject(new Error('Pencere kapatıldı. Tekrar deneyin veya "Token ile bağlan" kullanın.'));
                }
            }, 500);
        });
    }

    // Add pomodoro session to calendar
    async addSessionToCalendar(session) {
        if (!this.isAuthorized || !this.accessToken) {
            throw new Error('Not authorized. Please authorize first.');
        }

        const startTime = new Date(session.timestamp);
        const endTime = new Date(startTime.getTime() + (session.duration || 25) * 60 * 1000);

        const event = {
            summary: `⏱ Pomodoro - ${session.mode === 'pomodoro' ? 'Odaklanma' : session.mode === 'short' ? 'Kısa Mola' : 'Uzun Mola'}`,
            description: `Pomodev ile tamamlanan ${session.duration || 25} dakikalık ${session.mode} seansı`,
            start: {
                dateTime: startTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            colorId: session.mode === 'pomodoro' ? '11' : '5', // Red for pomodoro, yellow for break
            reminders: {
                useDefault: false,
                overrides: []
            }
        };

        try {
            const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to add event');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            // If direct API call fails, try backend proxy
            return await this.addSessionViaBackend(session);
        }
    }

    // Add session via backend proxy (more secure)
    async addSessionViaBackend(session) {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            throw new Error('Not logged in');
        }

        const response = await fetch('/api/calendar/add-event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                session: session,
                calendarToken: this.accessToken
            })
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to add event');
        }

        return data.data;
    }

    // Disconnect Google Calendar
    disconnect() {
        this.accessToken = null;
        this.isAuthorized = false;
        localStorage.removeItem('google_calendar_token');
        showNotification('✅ Google Calendar bağlantısı kesildi', '');
    }

    // Check authorization status
    getStatus() {
        return {
            authorized: this.isAuthorized,
            hasToken: !!this.accessToken
        };
    }
}

// Global instance
const calendarManager = new CalendarManager();

// Setup calendar UI in settings - DISABLED: Feature requires OAuth setup
function setupCalendarSettings() {
    // Calendar integration is an advanced feature
    // No longer adding dynamic sections to avoid UI clutter
    return;
}

function updateCalendarStatus() {
    const status = calendarManager.getStatus();
    const statusText = document.getElementById('calendarStatusText');
    const connectBtn = document.getElementById('calendarConnectBtn');
    const disconnectBtn = document.getElementById('calendarDisconnectBtn');
    
    if (statusText) {
        if (status.authorized) {
            statusText.innerHTML = '✅ <strong>Bağlı</strong> - Pomodoro\'lar otomatik takvime eklenecek';
            if (connectBtn) connectBtn.style.display = 'none';
            if (disconnectBtn) disconnectBtn.style.display = 'block';
        } else {
            statusText.innerHTML = '❌ <strong>Bağlı Değil</strong> - Bağlanmak için butona tıkla';
            if (connectBtn) connectBtn.style.display = 'block';
            if (disconnectBtn) disconnectBtn.style.display = 'none';
        }
    }
}

// Auto-add to calendar when pomodoro completes
function setupAutoCalendarSync() {
    // Override syncSession to also add to calendar
    const originalSyncSession = window.syncSession;
    if (originalSyncSession) {
        window.syncSession = async function(mode, duration) {
            await originalSyncSession(mode, duration);
            
            // Also add to calendar if authorized
            if (calendarManager.isAuthorized) {
                try {
                    await calendarManager.addSessionToCalendar({
                        mode: mode,
                        duration: duration,
                        timestamp: new Date().toISOString()
                    });
                } catch (error) {
                    console.log('Calendar sync failed:', error);
                }
            }
        };
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await calendarManager.init();
    setTimeout(setupCalendarSettings, 1500);
    setTimeout(setupAutoCalendarSync, 2000);
    // Ayarlar modalındaki takvim durumunu güncelle (calendarManager artık hazır)
    setTimeout(function() {
        if (typeof updateCalendarStatusInSettings === 'function') updateCalendarStatusInSettings();
    }, 500);
});

// Make available globally
window.calendarManager = calendarManager;
window.setGoogleCalendarToken = function(token) {
    return calendarManager.setTokenManually(token);
};
