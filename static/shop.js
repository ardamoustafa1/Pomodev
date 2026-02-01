
const SHOP_ITEMS = {
    themes: [
        {
            id: 'default', name: 'Varsayılan (Reset)', price: 0, type: 'theme', icon: '⏪', color: '#333',
            vars: null // Null vars means reset
        },
        {
            id: 'forest', name: 'Doğa (Forest)', price: 500, type: 'theme', icon: '🌲', color: '#2ecc71',
            vars: { '--bg': '#0f2015', '--panel': 'rgba(20, 50, 30, 0.7)', '--primary': '#2ecc71', '--text': '#e8f5e9' }
        },
        {
            id: 'cyberpunk', name: 'Cyberpunk', price: 1000, type: 'theme', icon: '🤖', color: '#f39c12',
            vars: { '--bg': '#050505', '--panel': 'rgba(40, 40, 0, 0.8)', '--primary': '#f39c12', '--text': '#fff0c0', '--muted': '#a69050' }
        },
        {
            id: 'midnight', name: 'Gece Yarısı', price: 1500, type: 'theme', icon: '🌃', color: '#8e44ad',
            vars: { '--bg': '#0a0510', '--panel': 'rgba(30, 10, 50, 0.7)', '--primary': '#9b59b6', '--text': '#f3e5f5' }
        },
        {
            id: 'ocean', name: 'Okyanus', price: 800, type: 'theme', icon: '🌊', color: '#00b4d8',
            vars: { '--bg': '#001524', '--panel': 'rgba(0, 40, 70, 0.7)', '--primary': '#48cae4', '--text': '#caf0f8' }
        }
    ],
    effects: [
        { id: 'confetti', name: 'Konfeti Patlaması', price: 500, type: 'effect', icon: '🎉' },
        { id: 'fireworks', name: 'Havai Fişek', price: 1000, type: 'effect', icon: '🎆' },
        { id: 'zen', name: 'Zen Modu (Sadece Timer)', price: 300, type: 'effect', icon: '🧘' }
    ],
    consumables: [
        { id: 'xp_potion', name: '2 Kat XP İksiri (2 Saat)', price: 400, type: 'consumable', icon: '🧪', duration: 7200000 }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    const shopBtn = document.getElementById('shopBtn');
    const shopModal = document.getElementById('shopModal');
    const closeShopBtn = document.getElementById('closeShopBtn');
    const shopUserXP = document.getElementById('shopUserXP');

    // Real inventory from localStorage (no DEV MODE)
    let inventory = JSON.parse(localStorage.getItem('pomodev_inventory')) || [];

    // Auto-select effect if not set
    if (!localStorage.getItem('pomodev_active_effect')) {
        localStorage.setItem('pomodev_active_effect', 'confetti');
    }

    if (shopBtn) {
        shopBtn.addEventListener('click', openShop);
    }

    if (closeShopBtn) {
        closeShopBtn.addEventListener('click', () => shopModal.classList.add('hidden'));
    }

    // Close on click outside
    window.addEventListener('click', (e) => {
        if (e.target === shopModal) {
            shopModal.classList.add('hidden');
        }
    });

    function openShop() {
        if (!shopModal) return;
        shopModal.classList.remove('hidden');
        updateShopUI();
    }

    function updateShopUI() {
        const currentXP = typeof dataManager !== 'undefined' ? dataManager.getXP() : parseInt(localStorage.getItem('pomodevXP') || '0');
        if (shopUserXP) shopUserXP.textContent = currentXP;

        renderCategory('shopThemesList', SHOP_ITEMS.themes);
        renderCategory('shopEffectsList', SHOP_ITEMS.effects);
        renderCategory('shopConsumablesList', SHOP_ITEMS.consumables);
    }

    function renderCategory(elementId, items) {
        const container = document.getElementById(elementId);
        if (!container) return;
        container.innerHTML = '';
        container.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 15px;';

        const currentXP = dataManager.getXP();

        items.forEach(item => {
            const isOwned = inventory.includes(item.id);
            const canAfford = currentXP >= item.price;

            // Sanitize item data (even though from constants, defense in depth)
            const safeIcon = (item.icon || '').replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));
            const safeName = (item.name || '').replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));
            const safePrice = parseInt(item.price) || 0;

            const card = document.createElement('div');
            card.style.cssText = `
                border: 1px solid #eee;
                border-radius: 10px;
                padding: 15px;
                text-align: center;
                background: ${isOwned ? '#f0fff4' : '#fff'};
                transition: transform 0.2s;
            `;

            card.innerHTML = `
                <div style="font-size:2rem; margin-bottom:10px;">${safeIcon}</div>
                <div style="font-weight:bold; margin-bottom:5px;">${safeName}</div>
                <div style="color:${isOwned ? 'green' : (canAfford ? '#666' : 'red')}; font-size:0.9rem; margin-bottom:10px;">
                    ${isOwned ? '✅ Satın Alındı' : safePrice + ' XP'}
                </div>
                ${!isOwned
                    ? `<button class="buy-btn" style="
                        width:100%; 
                        padding:8px; 
                        border:none; 
                        border-radius:6px; 
                        background:${canAfford ? 'var(--primary)' : '#ccc'}; 
                        color:white; 
                        cursor:${canAfford ? 'pointer' : 'not-allowed'}
                       ">Satın Al</button>`
                    : '<button class="apply-btn" style="width:100%; padding:8px; border:1px solid var(--primary); background:none; color:var(--primary); border-radius:6px; cursor:pointer;">Uygula</button>'
                }
            `;

            if (!isOwned && canAfford) {
                card.querySelector('.buy-btn').addEventListener('click', () => buyItem(item));
            } else if (isOwned) {
                card.querySelector('.apply-btn').addEventListener('click', () => applyItem(item));
            }

            container.appendChild(card);
        });
    }

    async function buyItem(item) {
        if (!confirm(`${item.name} ürününü ${item.price} XP karşılığında almak istiyor musun?`)) return;

        // Deduct XP
        let currentXP = dataManager.getXP();
        currentXP -= item.price;
        dataManager.setXP(currentXP);

        // Add to inventory
        inventory.push(item.id);
        localStorage.setItem('pomodev_inventory', JSON.stringify(inventory));

        // Sync with server
        if (typeof syncProgress === 'function') {
            await syncProgress();
        }

        alert(`🎉 ${item.name} satın alındı! Keyfini çıkar.`);
        updateShopUI();
        updateGamificationUI();
    }

    function applyItem(item) {
        if (item.type === 'theme') {
            applyTheme(item);
        } else if (item.type === 'effect') {
            localStorage.setItem('pomodev_active_effect', item.id);
            alert(`${item.name} aktif edildi! Timer bitince göreceksin.`);
        } else if (item.type === 'consumable') {
            if (item.id === 'xp_potion') {
                const now = Date.now();
                const endTime = now + item.duration;
                localStorage.setItem('xp_potion_end', endTime);
                alert('🧪 2 Kat XP İksiri içildi! 2 saat boyunca çift XP kazanacaksın.');
                updateGamificationUI();
            }
        }
    }

    function applyTheme(item) {
        const root = document.documentElement;

        // List of all possible CSS variables to remove
        const propertiesToRemove = [
            '--bg', '--panel', '--panel-strong',
            '--text', '--muted',
            '--primary', '--primary-strong',
            '--bg-body', '--radius'
        ];

        propertiesToRemove.forEach(prop => root.style.removeProperty(prop));

        // If default/reset
        if (item.id === 'default' || !item.vars) {
            localStorage.setItem('pomodev_active_theme', 'default');
            alert('Tema varsayılana döndürüldü!');
            return;
        }

        if (item.vars) {
            Object.entries(item.vars).forEach(([key, val]) => {
                root.style.setProperty(key, val);
            });
            if (!item.vars['--primary-strong'] && item.vars['--primary']) {
                root.style.setProperty('--primary-strong', item.vars['--primary']);
            }
        }

        localStorage.setItem('pomodev_active_theme', item.id);
        alert(`${item.name} teması uygulandı!`);
    }

    // Init: Load active theme on page load
    const savedThemeId = localStorage.getItem('pomodev_active_theme');
    if (savedThemeId && savedThemeId !== 'default') {
        const theme = SHOP_ITEMS.themes.find(t => t.id === savedThemeId);
        if (theme && theme.vars) {
            const root = document.documentElement;
            Object.entries(theme.vars).forEach(([key, val]) => {
                root.style.setProperty(key, val);
            });
            if (!theme.vars['--primary-strong'] && theme.vars['--primary']) {
                root.style.setProperty('--primary-strong', theme.vars['--primary']);
            }
        }
    }
});
