
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
            leaderboardModal.classList.add('hidden');
        });
    }

    // Close on click outside
    window.addEventListener('click', (e) => {
        if (e.target === leaderboardModal) {
            leaderboardModal.classList.add('hidden');
        }
    });

    async function openLeaderboard() {
        leaderboardModal.classList.remove('hidden');
        leaderboardList.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">Yükleniyor...</div>';

        try {
            const res = await fetch('/api/leaderboard');
            const data = await res.json();

            renderLeaderboard(data);
        } catch (err) {
            leaderboardList.innerHTML = '<div style="text-align:center; color:red;">Veriler yüklenemedi.</div>';
        }
    }

    function renderLeaderboard(users) {
        leaderboardList.innerHTML = '';
        const currentUser = JSON.parse(localStorage.getItem('pomodev_user'));

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

            item.innerHTML = `
                <div style="font-weight:bold; width:30px; text-align:center;">${badge}</div>
                <div style="flex:1;">
                    <div style="font-weight:600; ${isMe ? 'color:var(--primary);' : ''}">${user.username} ${isMe ? '(Sen)' : ''}</div>
                    <div style="font-size:0.8rem; color:#666;">Level ${user.level}</div>
                </div>
                <div style="font-weight:bold; color:#666;">${user.xp} XP</div>
            `;

            leaderboardList.appendChild(item);
        });
    }
});
