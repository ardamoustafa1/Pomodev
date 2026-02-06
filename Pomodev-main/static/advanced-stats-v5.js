/**
 * Advanced Statistics and Analytics
 * Enhanced statistics with trends, comparisons, and insights
 */

class AdvancedStats {
    constructor() {
        this.stats = this.loadStats();
    }

    loadStats() {
        const saved = localStorage.getItem('pomodevData');
        return saved ? JSON.parse(saved) : {};
    }

    // Get productivity trends (last 7, 30, 90 days)
    getProductivityTrends(days = 30) {
        const history = this.stats.pomodoroHistory || [];
        const now = new Date();
        const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        const recentHistory = history.filter(session =>
            new Date(session.timestamp) >= cutoffDate
        );

        // Group by date
        const dailyStats = {};
        recentHistory.forEach(session => {
            const date = new Date(session.timestamp).toDateString();
            if (!dailyStats[date]) {
                dailyStats[date] = { count: 0, minutes: 0 };
            }
            dailyStats[date].count++;
            dailyStats[date].minutes += (session.duration || 25);
        });

        // Convert to array and sort
        const trends = Object.keys(dailyStats)
            .map(date => ({
                date: date,
                count: dailyStats[date].count,
                minutes: dailyStats[date].minutes
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        return trends;
    }

    // Get productivity score (0-100)
    getProductivityScore() {
        const trends = this.getProductivityTrends(30);
        if (trends.length === 0) return 0;

        const totalPomodoros = trends.reduce((sum, day) => sum + day.count, 0);
        const avgPerDay = totalPomodoros / trends.length;
        const consistency = this.getConsistencyScore(trends);

        // Score based on average pomodoros per day and consistency
        const score = Math.min(100, (avgPerDay * 10) + (consistency * 0.5));
        return Math.round(score);
    }

    // Get consistency score (0-100)
    getConsistencyScore(trends) {
        if (trends.length < 7) return 0;

        const counts = trends.map(t => t.count);
        const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
        const variance = counts.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) / counts.length;
        const stdDev = Math.sqrt(variance);

        // Lower stdDev = higher consistency
        const consistency = Math.max(0, 100 - (stdDev * 10));
        return Math.round(consistency);
    }

    // Get best day of week
    getBestDayOfWeek() {
        const history = this.stats.pomodoroHistory || [];
        if (history.length === 0) return { day: 'Henüz veri yok', count: 0 };

        const dayStats = {};

        history.forEach(session => {
            const date = new Date(session.timestamp);
            const dayName = date.toLocaleDateString('tr-TR', { weekday: 'long' });

            if (!dayStats[dayName]) {
                dayStats[dayName] = 0;
            }
            dayStats[dayName]++;
        });

        const dayKeys = Object.keys(dayStats);
        if (dayKeys.length === 0) return { day: 'Henüz veri yok', count: 0 };

        const bestDay = dayKeys.reduce((a, b) =>
            dayStats[a] > dayStats[b] ? a : b
            , dayKeys[0] || 'Henüz veri yok');

        return {
            day: bestDay,
            count: dayStats[bestDay]
        };
    }

    // Get best time of day
    getBestTimeOfDay() {
        const history = this.stats.pomodoroHistory || [];
        if (history.length === 0) return { hour: 0, count: 0 };

        const hourStats = {};

        history.forEach(session => {
            const date = new Date(session.timestamp);
            const hour = date.getHours();

            if (!hourStats[hour]) {
                hourStats[hour] = 0;
            }
            hourStats[hour]++;
        });

        const hourKeys = Object.keys(hourStats);
        if (hourKeys.length === 0) return { hour: 0, count: 0 };

        const bestHour = hourKeys.reduce((a, b) =>
            hourStats[a] > hourStats[b] ? a : b
            , hourKeys[0] || "0");

        return {
            hour: parseInt(bestHour),
            count: hourStats[bestHour]
        };
    }

    // Compare with previous period
    comparePeriods(currentDays = 7, previousDays = 7) {
        const now = new Date();
        const currentStart = new Date(now.getTime() - currentDays * 24 * 60 * 60 * 1000);
        const previousStart = new Date(currentStart.getTime() - previousDays * 24 * 60 * 60 * 1000);

        const history = this.stats.pomodoroHistory || [];

        const current = history.filter(s =>
            new Date(s.timestamp) >= currentStart
        );

        const previous = history.filter(s =>
            new Date(s.timestamp) >= previousStart && new Date(s.timestamp) < currentStart
        );

        const currentCount = current.length;
        const previousCount = previous.length;
        const change = currentCount - previousCount;
        const changePercent = previousCount > 0 ? ((change / previousCount) * 100).toFixed(1) : 0;

        return {
            current: currentCount,
            previous: previousCount,
            change: change,
            changePercent: changePercent,
            trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
        };
    }

    // Get insights and recommendations
    getInsights() {
        const insights = [];
        const trends = this.getProductivityTrends(7);
        const comparison = this.comparePeriods(7, 7);
        const bestDay = this.getBestDayOfWeek();
        const bestTime = this.getBestTimeOfDay();
        const score = this.getProductivityScore();

        // Trend insight
        if (comparison.trend === 'up') {
            insights.push({
                type: 'positive',
                icon: '📈',
                title: 'Yükselişte!',
                message: `Son 7 günde ${comparison.change} pomodoro daha fazla tamamladın. Harika gidiyorsun!`
            });
        } else if (comparison.trend === 'down') {
            insights.push({
                type: 'warning',
                icon: '📉',
                title: 'Dikkat',
                message: `Son 7 günde ${Math.abs(comparison.change)} pomodoro daha az tamamladın. Hızlanma zamanı!`
            });
        }

        // Best day insight
        if (bestDay.count > 0) {
            insights.push({
                type: 'info',
                icon: '⭐',
                title: 'En Verimli Gün',
                message: `En çok ${bestDay.day} günleri çalışıyorsun (${bestDay.count} pomodoro). Bu günleri daha verimli kullan!`
            });
        }

        // Best time insight
        if (bestTime.count > 0) {
            insights.push({
                type: 'info',
                icon: '🕐',
                title: 'En Verimli Saat',
                message: `En çok ${bestTime.hour}:00-${bestTime.hour + 1}:00 saatleri arasında çalışıyorsun. Bu saatleri koru!`
            });
        }

        // Score insight
        if (score >= 80) {
            insights.push({
                type: 'positive',
                icon: '🏆',
                title: 'Mükemmel Skor!',
                message: `Üretkenlik skorun ${score}/100. Sen gerçekten odaklanmışsın!`
            });
        } else if (score < 50) {
            insights.push({
                type: 'warning',
                icon: '💪',
                title: 'Gelişim Fırsatı',
                message: `Üretkenlik skorun ${score}/100. Daha fazla pomodoro tamamlayarak skorunu artırabilirsin!`
            });
        }

        return insights;
    }
}

// Global instance
const advancedStats = new AdvancedStats();

// Enhance analytics modal with advanced stats
function enhanceAnalyticsModal() {
    // Wait for analytics modal to exist
    const checkModal = setInterval(() => {
        const analyticsModal = document.getElementById('analyticsModal');
        if (!analyticsModal) return;

        // Check if advanced stats section already exists
        if (document.getElementById('advancedStatsSection')) {
            clearInterval(checkModal);
            return;
        }

        const advancedSection = document.createElement('div');
        advancedSection.id = 'advancedStatsSection';
        advancedSection.className = 'panel-section glass';
        advancedSection.style.marginTop = '20px';
        advancedSection.innerHTML = `
            <h3>📊 Gelişmiş İstatistikler</h3>
            
            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
                <div class="stat-card">
                    <div class="stat-value" id="productivityScore">-</div>
                    <div class="stat-label">Üretkenlik Skoru</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="consistencyScore">-</div>
                    <div class="stat-label">Tutarlılık</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="periodComparison">-</div>
                    <div class="stat-label">Son 7 Gün Değişim</div>
                </div>
            </div>

            <div id="insightsContainer" style="margin-top: 20px;">
                <h4>💡 Öneriler ve İçgörüler</h4>
                <div id="insightsList"></div>
            </div>
        `;

        // Find analytics modal body
        const modalBody = analyticsModal.querySelector('.modal-body') || analyticsModal;
        modalBody.appendChild(advancedSection);

        // Render advanced stats
        renderAdvancedStats();

        clearInterval(checkModal);
    }, 500);
}

function renderAdvancedStats() {
    const score = advancedStats.getProductivityScore();
    const trends = advancedStats.getProductivityTrends(7);
    const consistency = advancedStats.getConsistencyScore(trends);
    const comparison = advancedStats.comparePeriods(7, 7);
    const insights = advancedStats.getInsights();

    // Update score
    const scoreEl = document.getElementById('productivityScore');
    if (scoreEl) {
        scoreEl.textContent = score + '/100';
        scoreEl.style.color = score >= 80 ? '#2ecc71' : score >= 50 ? '#f39c12' : '#e74c3c';
    }

    // Update consistency
    const consistencyEl = document.getElementById('consistencyScore');
    if (consistencyEl) {
        consistencyEl.textContent = consistency + '%';
    }

    // Update comparison
    const comparisonEl = document.getElementById('periodComparison');
    if (comparisonEl) {
        const trendIcon = comparison.trend === 'up' ? '📈' : comparison.trend === 'down' ? '📉' : '➡️';
        const sign = comparison.change >= 0 ? '+' : '';
        comparisonEl.innerHTML = `${trendIcon} ${sign}${comparison.change} (${comparison.changePercent}%)`;
        comparisonEl.style.color = comparison.trend === 'up' ? '#2ecc71' : comparison.trend === 'down' ? '#e74c3c' : '#95a5a6';
    }

    // Render insights
    const insightsList = document.getElementById('insightsList');
    if (insightsList && insights.length > 0) {
        insightsList.innerHTML = insights.map(insight => `
            <div class="insight-card" style="
                background: ${insight.type === 'positive' ? 'rgba(46, 204, 113, 0.1)' : insight.type === 'warning' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(52, 152, 219, 0.1)'};
                border-left: 3px solid ${insight.type === 'positive' ? '#2ecc71' : insight.type === 'warning' ? '#e74c3c' : '#3498db'};
                padding: 15px;
                margin: 10px 0;
                border-radius: 8px;
            ">
                <div style="display: flex; align-items: start; gap: 10px;">
                    <span style="font-size: 1.5em;">${insight.icon}</span>
                    <div>
                        <div style="font-weight: 600; margin-bottom: 5px;">${insight.title}</div>
                        <div style="font-size: 0.9em; color: rgba(255,255,255,0.8);">${insight.message}</div>
                    </div>
                </div>
            </div>
        `).join('');
    } else if (insightsList) {
        insightsList.innerHTML = '<p style="color: rgba(255,255,255,0.5);">Henüz yeterli veri yok. Daha fazla pomodoro tamamladıkça öneriler burada görünecek.</p>';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(enhanceAnalyticsModal, 2000);
});

// Make available globally
window.advancedStats = advancedStats;
window.renderAdvancedStats = renderAdvancedStats;
