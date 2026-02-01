document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const authModal = document.getElementById('authModal');
    const closeAuthBtn = document.getElementById('closeAuthBtn');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const authForm = document.getElementById('authForm');
    const authSubmitBtn = authForm?.querySelector('button[type="submit"]');
    const authError = document.getElementById('authError');

    // Exit if required elements don't exist
    if (!loginBtn || !authModal || !authForm) {
        console.warn('Auth: Required elements not found');
        return;
    }

    let isRegisterMode = false;
    let currentUser = null;
    try {
        currentUser = JSON.parse(localStorage.getItem('pomodev_user')) || null;
    } catch (e) {
        currentUser = null;
    }

    // --- Initialization ---
    if (currentUser) {
        updateUserUI(currentUser);
    }

    // --- Event Listeners ---
    loginBtn.addEventListener('click', () => {
        if (currentUser) {
            if (confirm('Çıkış yapmak istiyor musunuz?')) {
                logout();
            }
        } else {
            authModal.classList.remove('hidden');
        }
    });

    if (closeAuthBtn) {
        closeAuthBtn.addEventListener('click', () => {
            authModal.classList.add('hidden');
        });
    }

    // Close on click outside
    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.classList.add('hidden');
        }
    });

    if (tabLogin) tabLogin.addEventListener('click', () => switchTab(false));
    if (tabRegister) tabRegister.addEventListener('click', () => switchTab(true));

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rawUsername = document.getElementById('authUsername').value;
        const rawPassword = document.getElementById('authPassword').value;

        // Validate username
        const usernameValidation = window.InputValidator ? 
            window.InputValidator.username(rawUsername) : 
            { valid: rawUsername && rawUsername.length >= 3, value: rawUsername, error: 'Geçersiz kullanıcı adı' };
        
        if (!usernameValidation.valid) {
            showError(usernameValidation.error);
            return;
        }
        
        // Validate password
        const passwordValidation = window.InputValidator ? 
            window.InputValidator.password(rawPassword) : 
            { valid: rawPassword && rawPassword.length >= 6, value: rawPassword, error: 'Şifre en az 6 karakter olmalı' };
        
        if (!passwordValidation.valid) {
            showError(passwordValidation.error);
            return;
        }
        
        const username = usernameValidation.value;
        const password = passwordValidation.value;

        const endpoint = isRegisterMode ? '/api/register' : '/api/login';

        try {
            if (authSubmitBtn) {
                authSubmitBtn.disabled = true;
                authSubmitBtn.textContent = 'İşleniyor...';
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Bir hata oluştu.');
            }

            const apiData = data.data || data;
            if (apiData && apiData.token) {
                localStorage.setItem('auth_token', apiData.token);
            }
            if (apiData && apiData.user) {
                // Login veya kayıt sonrası kullanıcı bilgisi geldi → oturum aç
                login(apiData.user);
                authModal.classList.add('hidden');
            } else if (isRegisterMode) {
                alert('Kayıt başarılı! Şimdi giriş yapabilirsin.');
                switchTab(false);
            }

        } catch (err) {
            showError(err.message);
        } finally {
            if (authSubmitBtn) {
                authSubmitBtn.disabled = false;
                authSubmitBtn.textContent = isRegisterMode ? 'Kayıt Ol' : 'Giriş Yap';
            }
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

            if (authSubmitBtn) authSubmitBtn.textContent = 'Kayıt Ol';
        } else {
            tabLogin.classList.add('active');
            tabLogin.style.borderBottom = '2px solid var(--primary)';
            tabLogin.style.color = 'var(--text)';

            tabRegister.classList.remove('active');
            tabRegister.style.borderBottom = 'none';
            tabRegister.style.color = '#999';

            if (authSubmitBtn) authSubmitBtn.textContent = 'Giriş Yap';
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
        // ... (existing logic) ...

        // Reload tasks for the new user
        if (window.loadTasks) {
            window.loadTasks();
        } else {
            location.reload(); // Fallback if script.js symbols aren't ready
        }
        // XP
        if (typeof dataManager !== 'undefined') {
            dataManager.setXP(user.xp || 0);
        }
        localStorage.setItem('pomodevXP', user.xp || 0);

        // Inventory
        localStorage.setItem('pomodev_inventory', user.inventory || '[]');

        // Stats + Settings: sunucudaki stats ve settings'i birleştir, loadData() aynı yapıyı görsün
        try {
            const stats = JSON.parse(user.stats || '{}');
            const settings = JSON.parse(user.settings || '{}');
            const merged = { ...stats, ...settings };
            localStorage.setItem('pomodevData', JSON.stringify(merged));
        } catch (e) {
            localStorage.setItem('pomodevData', '{}');
        }

        // Tema / accent (DOM ve localStorage)
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
        localStorage.removeItem('auth_token');

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
