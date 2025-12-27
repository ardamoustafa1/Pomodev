
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const authModal = document.getElementById('authModal');
    const closeAuthBtn = document.getElementById('closeAuthBtn');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const authForm = document.getElementById('authForm');
    const authSubmitBtn = authForm.querySelector('button[type="submit"]');
    const authError = document.getElementById('authError');

    let isRegisterMode = false;
    let currentUser = JSON.parse(localStorage.getItem('pomodev_user')) || null;

    // --- Initialization ---
    if (currentUser) {
        updateUserUI(currentUser);
    }

    // --- Event Listeners ---
    loginBtn.addEventListener('click', () => {
        if (currentUser) {
            // If logged in, maybe show profile or logout?
            if (confirm('Çıkış yapmak istiyor musunuz?')) {
                logout();
            }
        } else {
            authModal.classList.remove('hidden');
        }
    });

    closeAuthBtn.addEventListener('click', () => {
        authModal.classList.add('hidden');
    });

    // Close on click outside
    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.classList.add('hidden');
        }
    });

    tabLogin.addEventListener('click', () => switchTab(false));
    tabRegister.addEventListener('click', () => switchTab(true));

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('authUsername').value;
        const password = document.getElementById('authPassword').value;

        if (password.length < 4) {
            showError('Şifre en az 4 karakter olmalı.');
            return;
        }

        const endpoint = isRegisterMode ? '/api/register' : '/api/login';

        try {
            authSubmitBtn.disabled = true;
            authSubmitBtn.textContent = 'İşleniyor...';

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Bir hata oluştu.');
            }

            if (isRegisterMode) {
                // Registration successful, verify switch to login
                alert('Kayıt başarılı! Şimdi giriş yapabilirsin.');
                switchTab(false);
            } else {
                // Login successful
                login(data.user);
                authModal.classList.add('hidden');
            }

        } catch (err) {
            showError(err.message);
        } finally {
            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = isRegisterMode ? 'Kayıt Ol' : 'Giriş Yap';
        }
    });

    // --- Helper Functions ---
    function switchTab(register) {
        isRegisterMode = register;
        authError.style.display = 'none';

        if (register) {
            tabRegister.classList.add('active');
            tabRegister.style.borderBottom = '2px solid var(--primary)';
            tabRegister.style.color = 'var(--text)';

            tabLogin.classList.remove('active');
            tabLogin.style.borderBottom = 'none';
            tabLogin.style.color = '#999';

            authSubmitBtn.textContent = 'Kayıt Ol';
        } else {
            tabLogin.classList.add('active');
            tabLogin.style.borderBottom = '2px solid var(--primary)';
            tabLogin.style.color = 'var(--text)';

            tabRegister.classList.remove('active');
            tabRegister.style.borderBottom = 'none';
            tabRegister.style.color = '#999';

            authSubmitBtn.textContent = 'Giriş Yap';
        }
    }

    function showError(msg) {
        authError.textContent = msg;
        authError.style.display = 'block';
    }

    function login(user) {
        currentUser = user;
        localStorage.setItem('pomodev_user', JSON.stringify(user));

        // Load ALL data from server (overwrite local)
        // XP
        if (typeof dataManager !== 'undefined') {
            dataManager.setXP(user.xp || 0);
        }
        localStorage.setItem('pomodevXP', user.xp || 0);

        // Inventory
        localStorage.setItem('pomodev_inventory', user.inventory || '[]');

        // Stats (todayPomodoros, weekPomodoros, streak, etc.)
        try {
            const stats = JSON.parse(user.stats || '{}');
            localStorage.setItem('pomodevData', JSON.stringify(stats));
        } catch (e) {
            localStorage.setItem('pomodevData', '{}');
        }

        // Settings
        try {
            const settings = JSON.parse(user.settings || '{}');
            if (settings.theme) localStorage.setItem('theme', settings.theme);
            if (settings.accent) localStorage.setItem('accent', settings.accent);
            if (settings.pomodev_active_theme) localStorage.setItem('pomodev_active_theme', settings.pomodev_active_theme);
            if (settings.pomodev_active_effect) localStorage.setItem('pomodev_active_effect', settings.pomodev_active_effect);
        } catch (e) { }

        // Tasks
        try {
            const tasks = JSON.parse(user.tasks || '[]');
            localStorage.setItem('pomodev_tasks', JSON.stringify(tasks));
        } catch (e) {
            localStorage.setItem('pomodev_tasks', '[]');
        }

        updateUserUI(user);

        // Refresh gamification UI
        if (typeof updateGamificationUI === 'function') {
            updateGamificationUI();
        }

        // Reload page to apply all changes
        location.reload();
    }

    function logout() {
        currentUser = null;
        localStorage.removeItem('pomodev_user');

        // Also reset XP to 0 when logging out
        localStorage.setItem('pomodevXP', 0);
        localStorage.setItem('pomodev_inventory', JSON.stringify([]));

        loginBtn.textContent = 'Giriş';
        loginBtn.title = 'Giriş Yap';

        // Refresh UI
        if (typeof updateGamificationUI === 'function') {
            updateGamificationUI();
        }
    }

    function updateUserUI(user) {
        loginBtn.textContent = user.username;
        loginBtn.title = `Kullanıcı: ${user.username} (Lvl ${user.level})`;
    }
});
