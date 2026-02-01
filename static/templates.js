/**
 * Pomodoro Templates System
 * Pre-defined pomodoro configurations for quick start
 */

class PomodoroTemplates {
    constructor() {
        this.storageKey = 'pomodev_templates';
        this.templates = this.loadTemplates();
        this.defaultTemplates = [
            {
                id: 'classic',
                name: 'Klasik Pomodoro',
                icon: '⏱',
                pomodoro: 25,
                shortBreak: 5,
                longBreak: 15,
                sessionsUntilLongBreak: 4
            },
            {
                id: 'deep-work',
                name: 'Derin Çalışma',
                icon: '🧠',
                pomodoro: 50,
                shortBreak: 10,
                longBreak: 20,
                sessionsUntilLongBreak: 4
            },
            {
                id: 'quick-focus',
                name: 'Hızlı Odaklanma',
                icon: '⚡',
                pomodoro: 15,
                shortBreak: 3,
                longBreak: 10,
                sessionsUntilLongBreak: 4
            },
            {
                id: 'extended',
                name: 'Uzatılmış Seans',
                icon: '⏰',
                pomodoro: 45,
                shortBreak: 15,
                longBreak: 30,
                sessionsUntilLongBreak: 3
            },
            {
                id: 'student',
                name: 'Öğrenci Modu',
                icon: '📚',
                pomodoro: 30,
                shortBreak: 5,
                longBreak: 15,
                sessionsUntilLongBreak: 4
            },
            {
                id: 'creative',
                name: 'Yaratıcı İş',
                icon: '🎨',
                pomodoro: 20,
                shortBreak: 5,
                longBreak: 15,
                sessionsUntilLongBreak: 3
            }
        ];
        
        // Initialize with defaults if empty
        if (this.templates.length === 0) {
            this.templates = [...this.defaultTemplates];
            this.saveTemplates();
        }
    }

    loadTemplates() {
        const saved = localStorage.getItem(this.storageKey);
        return saved ? JSON.parse(saved) : [];
    }

    saveTemplates() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.templates));
    }

    // Get all templates
    getTemplates() {
        return this.templates;
    }

    // Get template by ID
    getTemplate(templateId) {
        return this.templates.find(t => t.id === templateId);
    }

    // Apply a template
    applyTemplate(templateId) {
        const template = this.getTemplate(templateId);
        if (!template) return false;

        // Update durations
        if (typeof durations !== 'undefined') {
            durations.pomodoro = template.pomodoro * 60;
            durations.short = template.shortBreak * 60;
            durations.long = template.longBreak * 60;
        }

        // Save to localStorage
        localStorage.setItem('pomodoroDuration', (template.pomodoro * 60).toString());
        localStorage.setItem('shortBreakDuration', (template.shortBreak * 60).toString());
        localStorage.setItem('longBreakDuration', (template.longBreak * 60).toString());
        localStorage.setItem('sessionsUntilLongBreak', template.sessionsUntilLongBreak.toString());

        // Update UI
        if (typeof loadData === 'function') {
            loadData();
        }
        if (typeof displayTime === 'function') {
            displayTime();
        }

        return true;
    }

    // Add custom template
    addTemplate(name, icon, pomodoro, shortBreak, longBreak, sessionsUntilLongBreak) {
        const template = {
            id: 'custom_' + Date.now(),
            name: name,
            icon: icon,
            pomodoro: pomodoro,
            shortBreak: shortBreak,
            longBreak: longBreak,
            sessionsUntilLongBreak: sessionsUntilLongBreak,
            custom: true
        };
        
        this.templates.push(template);
        this.saveTemplates();
        return template;
    }

    // Delete custom template
    deleteTemplate(templateId) {
        const template = this.getTemplate(templateId);
        if (!template || !template.custom) return false;
        
        this.templates = this.templates.filter(t => t.id !== templateId);
        this.saveTemplates();
        return true;
    }
}

// Global instance
const pomodoroTemplates = new PomodoroTemplates();

// Setup templates UI
function setupTemplatesUI() {
    const timerSection = document.querySelector('.timer-section');
    if (!timerSection) return;
    
    // Check if templates button already exists
    if (document.getElementById('templatesBtn')) return;

    // Add templates button next to mode buttons
    const modeButtons = document.querySelector('.mode-buttons');
    if (modeButtons) {
        const templatesBtn = document.createElement('button');
        templatesBtn.id = 'templatesBtn';
        templatesBtn.className = 'mode-btn';
        templatesBtn.innerHTML = '📋 Şablonlar';
        templatesBtn.title = 'Pomodoro Şablonları';
        templatesBtn.addEventListener('click', showTemplatesModal);
        
        modeButtons.appendChild(templatesBtn);
    }
}

function showTemplatesModal() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('templatesModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'templatesModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2>📋 Pomodoro Şablonları</h2>
                    <button onclick="closeTemplatesModal()" style="background: transparent; border: none; font-size: 1.5em; cursor: pointer; color: var(--text);">×</button>
                </div>
                <div id="templatesList" class="templates-grid">
                    <!-- Templates will be rendered here -->
                </div>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <button onclick="showAddTemplateModal()" class="btn" style="width: 100%;">
                        + Özel Şablon Ekle
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    modal.classList.remove('hidden');
    renderTemplates();
}

function closeTemplatesModal() {
    const modal = document.getElementById('templatesModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function renderTemplates() {
    const templatesList = document.getElementById('templatesList');
    if (!templatesList) return;

    const templates = pomodoroTemplates.getTemplates();
    
    templatesList.innerHTML = templates.map(template => {
        const isCustom = template.custom || false;
        return `
            <div class="template-card ${isCustom ? 'custom' : ''}" onclick="applyTemplate('${template.id}')">
                <div class="template-icon">${template.icon}</div>
                <div class="template-name">${template.name}</div>
                <div class="template-details">
                    <div>⏱ ${template.pomodoro} dk</div>
                    <div>☕ ${template.shortBreak} dk</div>
                    <div>🌴 ${template.longBreak} dk</div>
                </div>
                ${isCustom ? `
                    <button class="template-delete" onclick="event.stopPropagation(); deleteTemplate('${template.id}')" title="Sil">🗑️</button>
                ` : ''}
            </div>
        `;
    }).join('');
}

function applyTemplate(templateId) {
    const success = pomodoroTemplates.applyTemplate(templateId);
    if (success) {
        const template = pomodoroTemplates.getTemplate(templateId);
        showNotification(`✅ "${template.name}" şablonu uygulandı`, '');
        closeTemplatesModal();
    }
}

function showAddTemplateModal() {
    const name = prompt('Şablon adı:');
    if (!name || name.trim() === '') return;

    const icon = prompt('İkon (emoji):') || '📋';
    
    const pomodoro = parseInt(prompt('Pomodoro süresi (dakika):') || '25');
    const shortBreak = parseInt(prompt('Kısa mola süresi (dakika):') || '5');
    const longBreak = parseInt(prompt('Uzun mola süresi (dakika):') || '15');
    const sessionsUntilLongBreak = parseInt(prompt('Kaç pomodoro sonra uzun mola:') || '4');

    if (isNaN(pomodoro) || isNaN(shortBreak) || isNaN(longBreak) || isNaN(sessionsUntilLongBreak)) {
        alert('Geçersiz değerler!');
        return;
    }

    pomodoroTemplates.addTemplate(name.trim(), icon, pomodoro, shortBreak, longBreak, sessionsUntilLongBreak);
    renderTemplates();
    showNotification('✅ Özel şablon eklendi', '');
}

function deleteTemplate(templateId) {
    if (confirm('Bu şablonu silmek istediğinize emin misiniz?')) {
        pomodoroTemplates.deleteTemplate(templateId);
        renderTemplates();
        showNotification('🗑️ Şablon silindi', '');
    }
}

// Make functions globally available
window.applyTemplate = applyTemplate;
window.closeTemplatesModal = closeTemplatesModal;
window.showAddTemplateModal = showAddTemplateModal;
window.deleteTemplate = deleteTemplate;
window.pomodoroTemplates = pomodoroTemplates;

// Add CSS for templates
const templatesCSS = `
.templates-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
}

.template-card {
    background: rgba(255,255,255,0.05);
    padding: 15px;
    border-radius: 12px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    border: 2px solid transparent;
}

.template-card:hover {
    background: rgba(255,255,255,0.1);
    border-color: var(--primary);
    transform: translateY(-2px);
}

.template-card.custom {
    border-color: rgba(255,255,255,0.2);
}

.template-icon {
    font-size: 2em;
    margin-bottom: 10px;
}

.template-name {
    font-weight: 600;
    margin-bottom: 10px;
}

.template-details {
    font-size: 0.85em;
    color: rgba(255,255,255,0.7);
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.template-delete {
    position: absolute;
    top: 5px;
    right: 5px;
    background: rgba(255,0,0,0.2);
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: 0.8em;
    opacity: 0.7;
    transition: opacity 0.2s;
}

.template-delete:hover {
    opacity: 1;
    background: rgba(255,0,0,0.4);
}
`;

// Inject CSS (değişken adı 'style' çakışmasını önlemek için templatesStyleEl)
const templatesStyleEl = document.createElement('style');
templatesStyleEl.textContent = templatesCSS;
document.head.appendChild(templatesStyleEl);

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(setupTemplatesUI, 1000);
    
    // Close modal on outside click
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('templatesModal');
        if (modal && e.target === modal) {
            closeTemplatesModal();
        }
    });
});
