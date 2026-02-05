document.addEventListener('DOMContentLoaded', () => {
    const leaderboardBtn = document.getElementById('leaderboardBtn');
    const leaderboardModal = document.getElementById('leaderboardModal');
    const closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');
    const leaderboardList = document.getElementById('leaderboardList');

    if (leaderboardBtn) {
        leaderboardBtn.addEventListener('click', openLeaderboard);
    }

    if (closeLeaderboardBtn) {
        closeLeaderboardBtn.addEventListener('click', () => {
            if (leaderboardModal) leaderboardModal.classList.add('hidden');
        });
    }

    // Close on click outside
    window.addEventListener('click', (e) => {
        if (leaderboardModal && e.target === leaderboardModal) {
            leaderboardModal.classList.add('hidden');
        }
    });

    async function openLeaderboard() {
        if (!leaderboardModal || !leaderboardList) return;
        leaderboardModal.classList.remove('hidden');
        leaderboardList.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">Yükleniyor...</div>';

        try {
            const res = await fetch('/api/leaderboard');
            if (!res.ok) {
                throw new Error('Leaderboard yüklenemedi');
            }
            
            const responseData = await res.json();
            // Handle standardized response format
            const data = responseData.success ? responseData.data : responseData;

            renderLeaderboard(data || []);
        } catch (err) {
            console.error('Leaderboard error:', err);
            leaderboardList.innerHTML = '<div style="text-align:center; color:red; padding:20px;">Veriler yüklenemedi: ' + err.message + '</div>';
        }
    }

    function renderLeaderboard(users) {
        if (!leaderboardList) return;
        leaderboardList.innerHTML = '';
        let currentUser = null;
        try {
            currentUser = JSON.parse(localStorage.getItem('pomodev_user'));
        } catch (e) {
            currentUser = null;
        }

        if (users.length === 0) {
            leaderboardList.innerHTML = '<div style="text-align:center; color:#666;">Henüz kimse yok. İlk sen ol!</div>';
            return;
        }

        users.forEach((user, index) => {
            const rank = index + 1;
            const isMe = currentUser && currentUser.username === user.username;

            const item = document.createElement('div');
            item.style.cssText = `
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px;
                background: ${isMe ? 'rgba(255, 77, 79, 0.1)' : '#f9f9f9'};
                border: 1px solid ${isMe ? 'var(--primary)' : '#eee'};
                border-radius: 8px;
            `;

            let badge = '';
            if (rank === 1) badge = '🥇';
            else if (rank === 2) badge = '🥈';
            else if (rank === 3) badge = '🥉';
            else badge = `#${rank}`;

            // Sanitize user data to prevent XSS
            const safeUsername = user.username ? user.username.replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c])) : 'Unknown';
            const safeLevel = parseInt(user.level) || 0;
            const safeXP = parseInt(user.xp) || 0;

            item.innerHTML = `
                <div style="font-weight:bold; width:30px; text-align:center;">${badge}</div>
                <div style="flex:1;">
                    <div style="font-weight:600; ${isMe ? 'color:var(--primary);' : ''}">${safeUsername} ${isMe ? '(Sen)' : ''}</div>
                    <div style="font-size:0.8rem; color:#666;">Level ${safeLevel}</div>
                </div>
                <div style="font-weight:bold; color:#666;">${safeXP} XP</div>
            `;

            leaderboardList.appendChild(item);
        });
    }
});
