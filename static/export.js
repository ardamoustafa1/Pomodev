/**
 * Export/Import functionality for Pomodev
 */

// Export data to JSON
function exportToJSON() {
    const data = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        user: JSON.parse(localStorage.getItem('pomodev_user') || 'null'),
        xp: parseInt(localStorage.getItem('pomodevXP') || '0'),
        inventory: JSON.parse(localStorage.getItem('pomodev_inventory') || '[]'),
        tasks: JSON.parse(localStorage.getItem('pomodev_tasks') || '[]'),
        notes: JSON.parse(localStorage.getItem('pomodev_notes') || '[]'),
        stats: JSON.parse(localStorage.getItem('pomodevData') || '{}'),
        settings: {
            theme: localStorage.getItem('theme') || 'dark',
            accent: localStorage.getItem('accent') || 'blue',
            pomodev_active_theme: localStorage.getItem('pomodev_active_theme') || 'default',
            pomodev_active_effect: localStorage.getItem('pomodev_active_effect') || 'confetti'
        }
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pomodev-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('✅ Export Başarılı', 'Verileriniz JSON dosyası olarak indirildi');
}

// Export tasks to CSV
function exportTasksToCSV() {
    const tasks = JSON.parse(localStorage.getItem('pomodev_tasks') || '[]');
    
    if (tasks.length === 0) {
        alert('Dışa aktarılacak görev bulunamadı.');
        return;
    }
    
    let csv = 'Görev,Proje,Tamamlandı,ID\n';
    tasks.forEach(task => {
        const text = (task.text || '').replace(/"/g, '""');
        const project = (task.project || 'General').replace(/"/g, '""');
        const completed = task.completed ? 'Evet' : 'Hayır';
        csv += `"${text}","${project}","${completed}",${task.id}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pomodev-tasks-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('✅ CSV Export Başarılı', 'Görevler CSV dosyası olarak indirildi');
}

// Export sessions/statistics to CSV
function exportSessionsToCSV() {
    const stats = JSON.parse(localStorage.getItem('pomodevData') || '{}');
    const history = stats.pomodoroHistory || [];
    
    if (history.length === 0) {
        alert('Dışa aktarılacak pomodoro geçmişi bulunamadı.');
        return;
    }
    
    let csv = 'Tarih,Mod,Süre (Dakika)\n';
    history.forEach(session => {
        const date = new Date(session.timestamp).toLocaleDateString('tr-TR');
        const mode = session.mode || 'pomodoro';
        const duration = session.duration || 25;
        csv += `"${date}","${mode}",${duration}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pomodev-sessions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('✅ CSV Export Başarılı', 'Pomodoro geçmişi CSV dosyası olarak indirildi');
}

// Import from JSON
function importFromJSON(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            if (!confirm('Mevcut verileriniz silinecek ve yeni veriler yüklenecek. Devam etmek istiyor musunuz?')) {
                return;
            }
            
            // Import data
            if (data.xp !== undefined) {
                localStorage.setItem('pomodevXP', data.xp.toString());
                if (typeof dataManager !== 'undefined') {
                    dataManager.setXP(data.xp);
                }
            }
            
            if (data.inventory) {
                localStorage.setItem('pomodev_inventory', JSON.stringify(data.inventory));
            }
            
            if (data.tasks) {
                localStorage.setItem('pomodev_tasks', JSON.stringify(data.tasks));
            }
            
            if (data.notes) {
                localStorage.setItem('pomodev_notes', JSON.stringify(data.notes));
            }
            
            if (data.stats) {
                localStorage.setItem('pomodevData', JSON.stringify(data.stats));
            }
            
            if (data.settings) {
                if (data.settings.theme) localStorage.setItem('theme', data.settings.theme);
                if (data.settings.accent) localStorage.setItem('accent', data.settings.accent);
                if (data.settings.pomodev_active_theme) localStorage.setItem('pomodev_active_theme', data.settings.pomodev_active_theme);
                if (data.settings.pomodev_active_effect) localStorage.setItem('pomodev_active_effect', data.settings.pomodev_active_effect);
            }
            
            // Reload page to apply changes
            alert('✅ Veriler başarıyla yüklendi! Sayfa yenilenecek...');
            location.reload();
            
        } catch (err) {
            alert('❌ Hata: Geçersiz JSON dosyası. ' + err.message);
        }
    };
    reader.readAsText(file);
}

// Generate PDF Report (using browser print)
function generatePDFReport() {
    const stats = JSON.parse(localStorage.getItem('pomodevData') || '{}');
    const xp = parseInt(localStorage.getItem('pomodevXP') || '0');
    const level = typeof gameManager !== 'undefined' ? gameManager.getLevel(xp) : 1;
    const todayPomodoros = stats.todayPomodoros || 0;
    const weekPomodoros = stats.weekPomodoros || 0;
    const streak = stats.currentStreak || 0;
    
    const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Pomodev Raporu - ${new Date().toLocaleDateString('tr-TR')}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #333; }
                .stat { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
                .stat-label { font-weight: bold; color: #666; }
                .stat-value { font-size: 1.2em; color: #333; }
            </style>
        </head>
        <body>
            <h1>📊 Pomodev Üretkenlik Raporu</h1>
            <p><strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
            
            <div class="stat">
                <div class="stat-label">Level</div>
                <div class="stat-value">${level}</div>
            </div>
            
            <div class="stat">
                <div class="stat-label">Toplam XP</div>
                <div class="stat-value">${xp.toLocaleString()}</div>
            </div>
            
            <div class="stat">
                <div class="stat-label">Bugünkü Pomodorolar</div>
                <div class="stat-value">${todayPomodoros}</div>
            </div>
            
            <div class="stat">
                <div class="stat-label">Haftalık Pomodorolar</div>
                <div class="stat-value">${weekPomodoros}</div>
            </div>
            
            <div class="stat">
                <div class="stat-label">Streak (Gün)</div>
                <div class="stat-value">${streak}</div>
            </div>
            
            <p style="margin-top: 30px; color: #666; font-size: 0.9em;">
                Bu rapor Pomodev tarafından oluşturulmuştur.<br>
                Daha fazla bilgi için: https://pomodev-omega.vercel.app
            </p>
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportHTML);
    printWindow.document.close();
    printWindow.onload = () => {
        printWindow.print();
    };
}

// Setup export buttons - DISABLED: Now integrated into settings tabs
function setupExportFeatures() {
    // Export features are now available via menu buttons
    // No longer adding dynamic sections to avoid UI clutter
    return;
}

// Make functions globally available
window.exportToJSON = exportToJSON;
window.exportTasksToCSV = exportTasksToCSV;
window.exportSessionsToCSV = exportSessionsToCSV;
window.importFromJSON = importFromJSON;
window.generatePDFReport = generatePDFReport;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(setupExportFeatures, 1000); // Wait for settings modal to be ready
});
