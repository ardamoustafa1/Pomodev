using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sayhi.ApiService.Features.Chat;
using Sayhi.ApiService.Repositories.Reporting;
using Sayhi.ApiService.Data;
using Sayhi.ApiService.Repositories;
using Sayhi.Model;
using static Sayhi.Model.AgentStatus;

namespace Sayhi.ApiService.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController(
        IDashboardCache dashboardCache,
        IAgentChatRepository agentChatRepository,
        IAiRequestRepository aiRequestRepository,
        IChatSentimentRepository chatSentimentRepository,
        IWordFrequencyRepository wordFrequencyRepository,
        AppDbContext appDbContext,
        IAgentRepository agentRepository,
        IChatRepository chatRepository,
        ILogger<DashboardController> logger) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetDashboardData(CancellationToken cancellationToken = default)
        {
            try
            {
                var today = DateTime.Today;
                var last7Days = today.AddDays(-7);
                var last30Days = today.AddDays(-30);

                // Today's stats
                var todayAgentChats = await agentChatRepository.Get()
                    .Where(a => a.Date == DateOnly.FromDateTime(today))
                    .SumAsync(a => a.Count, cancellationToken);

                var todayAiRequests = await aiRequestRepository.Get()
                    .Where(a => a.Date == DateOnly.FromDateTime(today))
                    .SumAsync(a => a.Count, cancellationToken);

                // Last 7 days stats
                var last7DaysAgentChats = await agentChatRepository.Get()
                    .Where(a => a.Date >= DateOnly.FromDateTime(last7Days) && a.Date <= DateOnly.FromDateTime(today))
                    .SumAsync(a => a.Count, cancellationToken);

                var last7DaysAiRequests = await aiRequestRepository.Get()
                    .Where(a => a.Date >= DateOnly.FromDateTime(last7Days) && a.Date <= DateOnly.FromDateTime(today))
                    .SumAsync(a => a.Count, cancellationToken);

                // Last 30 days stats
                var last30DaysAgentChats = await agentChatRepository.Get()
                    .Where(a => a.Date >= DateOnly.FromDateTime(last30Days) && a.Date <= DateOnly.FromDateTime(today))
                    .SumAsync(a => a.Count, cancellationToken);

                var last30DaysAiRequests = await aiRequestRepository.Get()
                    .Where(a => a.Date >= DateOnly.FromDateTime(last30Days) && a.Date <= DateOnly.FromDateTime(today))
                    .SumAsync(a => a.Count, cancellationToken);

                // Total chats
                var totalChats = await chatSentimentRepository.Get()
                    .Where(c => c.Date >= DateOnly.FromDateTime(last30Days) && c.Date <= DateOnly.FromDateTime(today))
                    .CountAsync(cancellationToken);

                // Positive sentiment percentage
                var positiveChats = await chatSentimentRepository.Get()
                    .Where(c => c.Date >= DateOnly.FromDateTime(last30Days) && c.Date <= DateOnly.FromDateTime(today) &&
                                (c.CustomerOverallTone.ToLower().Contains("positive") || c.CustomerOverallTone.ToLower().Contains("pozitif")))
                    .CountAsync(cancellationToken);

                var positivePercentage = totalChats > 0 ? (double)positiveChats / totalChats * 100 : 0;

                // Total messages
                var todayMessages = await appDbContext.ChatMessages
                    .Where(m => m.CreatedAt >= today && m.CreatedAt < today.AddDays(1))
                    .CountAsync(cancellationToken);

                var last7DaysMessages = await appDbContext.ChatMessages
                    .Where(m => m.CreatedAt >= last7Days && m.CreatedAt < today.AddDays(1))
                    .CountAsync(cancellationToken);

                var last30DaysMessages = await appDbContext.ChatMessages
                    .Where(m => m.CreatedAt >= last30Days && m.CreatedAt < today.AddDays(1))
                    .CountAsync(cancellationToken);

                // Total chats created
                var todayChatsCreated = await appDbContext.Chats
                    .Where(c => c.CreatedAt >= today && c.CreatedAt < today.AddDays(1))
                    .CountAsync(cancellationToken);

                var last7DaysChatsCreated = await appDbContext.Chats
                    .Where(c => c.CreatedAt >= last7Days && c.CreatedAt < today.AddDays(1))
                    .CountAsync(cancellationToken);

                // Unique agents
                var uniqueAgentsLast30Days = await agentChatRepository.Get()
                    .Where(a => a.Date >= DateOnly.FromDateTime(last30Days) && a.Date <= DateOnly.FromDateTime(today))
                    .Select(a => a.AgentId)
                    .Distinct()
                    .CountAsync(cancellationToken);

                // Total agents
                var totalAgents = await agentRepository.Get().CountAsync(cancellationToken);
                var availableAgents = await agentRepository.Get()
                    .Where(a => a.Status == AgentStatus.Available)
                    .CountAsync(cancellationToken);

                // Top agents
                var topAgents = await agentChatRepository.Get()
                    .Where(a => a.Date >= DateOnly.FromDateTime(last7Days) && a.Date <= DateOnly.FromDateTime(today))
                    .GroupBy(a => new { a.AgentId, a.AgentName })
                    .Select(g => new
                    {
                        AgentId = g.Key.AgentId,
                        AgentName = g.Key.AgentName,
                        TotalChats = g.Sum(x => x.Count)
                    })
                    .OrderByDescending(x => x.TotalChats)
                    .Take(5)
                    .ToListAsync(cancellationToken);

                // Negative sentiment
                var negativeChats = await chatSentimentRepository.Get()
                    .Where(c => c.Date >= DateOnly.FromDateTime(last30Days) && c.Date <= DateOnly.FromDateTime(today) &&
                                (c.CustomerOverallTone.ToLower().Contains("negative") || c.CustomerOverallTone.ToLower().Contains("negatif")))
                    .CountAsync(cancellationToken);

                var negativePercentage = totalChats > 0 ? (double)negativeChats / totalChats * 100 : 0;

                // Average daily chats
                var averageDailyChats7Days = last7DaysAgentChats / 7.0;
                var averageDailyChats30Days = last30DaysAgentChats / 30.0;

                // Top keywords
                var topKeywords = await wordFrequencyRepository.Get()
                    .Where(w => w.Date >= DateOnly.FromDateTime(last30Days) && w.Date <= DateOnly.FromDateTime(today))
                    .GroupBy(w => w.Keyword)
                    .Select(g => new
                    {
                        Keyword = g.Key,
                        TotalUsage = g.Sum(x => x.UsageCount)
                    })
                    .OrderByDescending(x => x.TotalUsage)
                    .Take(5)
                    .ToListAsync(cancellationToken);

                // Hourly activity for today
                var hourlyActivity = new List<object>();
                for (int hour = 0; hour < 24; hour++)
                {
                    var hourStart = today.AddHours(hour);
                    var hourEnd = hourStart.AddHours(1);
                    var hourChats = await appDbContext.Chats
                        .Where(c => c.CreatedAt >= hourStart && c.CreatedAt < hourEnd)
                        .CountAsync(cancellationToken);
                    var hourMessages = await appDbContext.ChatMessages
                        .Where(m => m.CreatedAt >= hourStart && m.CreatedAt < hourEnd)
                        .CountAsync(cancellationToken);

                    hourlyActivity.Add(new
                    {
                        Hour = hour,
                        HourLabel = $"{hour:00}:00",
                        Chats = hourChats,
                        Messages = hourMessages
                    });
                }

                // Daily chart data for last 7 days
                var dailyData = new List<object>();
                for (int i = 6; i >= 0; i--)
                {
                    var date = today.AddDays(-i);
                    var chats = await agentChatRepository.Get()
                        .Where(a => a.Date == DateOnly.FromDateTime(date))
                        .SumAsync(a => a.Count, cancellationToken);
                    var requests = await aiRequestRepository.Get()
                        .Where(a => a.Date == DateOnly.FromDateTime(date))
                        .SumAsync(a => a.Count, cancellationToken);
                    var messages = await appDbContext.ChatMessages
                        .Where(m => m.CreatedAt >= date && m.CreatedAt < date.AddDays(1))
                        .CountAsync(cancellationToken);

                    dailyData.Add(new
                    {
                        Date = date.ToString("yyyy-MM-dd"),
                        DayName = date.ToString("dddd", new System.Globalization.CultureInfo("tr-TR")),
                        AgentChats = chats,
                        AiRequests = requests,
                        Messages = messages
                    });
                }

                // Weekly comparison
                var thisWeekChats = await agentChatRepository.Get()
                    .Where(a => a.Date >= DateOnly.FromDateTime(today.AddDays(-7)) && a.Date <= DateOnly.FromDateTime(today))
                    .SumAsync(a => a.Count, cancellationToken);

                var lastWeekChats = await agentChatRepository.Get()
                    .Where(a => a.Date >= DateOnly.FromDateTime(today.AddDays(-14)) && a.Date < DateOnly.FromDateTime(today.AddDays(-7)))
                    .SumAsync(a => a.Count, cancellationToken);

                var weekOverWeekChange = lastWeekChats > 0 ? ((double)(thisWeekChats - lastWeekChats) / lastWeekChats * 100) : 0;

                // Last 1 hour data
                var lastHourAgentChatSuccess = await agentChatRepository.Get()
                    .Where(a => a.Date == DateOnly.FromDateTime(today))
                    .Select(a => new
                    {
                        AgentName = a.AgentName,
                        ChatCount = a.Count
                    })
                    .OrderByDescending(x => x.ChatCount)
                    .ToListAsync(cancellationToken);

                var lastHourAiRequests = await (from msg in appDbContext.ChatMessages
                                               where msg.CreatedAt >= DateTime.UtcNow.AddHours(-1) &&
                                                     msg.SenderId == Guid.Parse("00000000-0000-0000-0000-000000000041")
                                               join chat in appDbContext.Chats on msg.ChatId equals chat.Id
                                               join participant in appDbContext.ChatParticipants on chat.Id equals participant.ChatId
                                               join agent in appDbContext.Agents on participant.PersonId equals agent.Id into agentGroup
                                               from agent in agentGroup.DefaultIfEmpty()
                                               join person in appDbContext.People on (agent != null ? agent.Id : Guid.Empty) equals person.Id into personGroup
                                               from person in personGroup.DefaultIfEmpty()
                                               where person != null
                                               group new { msg.ChatId, person.Name } by new { person.Name, msg.ChatId } into g
                                               select new
                                               {
                                                   AgentName = g.Key.Name ?? "Bilinmeyen",
                                                   ChatId = g.Key.ChatId.ToString(),
                                                   RequestCount = g.Count()
                                               })
                                               .ToListAsync(cancellationToken);

                var lastHourChatSentiments = await chatSentimentRepository.Get()
                    .Where(s => s.Date == DateOnly.FromDateTime(today))
                    .Select(s => new
                    {
                        AgentName = s.AgentName,
                        ChatId = s.ChatId,
                        CustomerOverallTone = s.CustomerOverallTone,
                        AgentOverallTone = s.AgentOverallTone
                    })
                    .OrderBy(x => x.AgentName)
                    .ThenBy(x => x.ChatId)
                    .ToListAsync(cancellationToken);

                var lastHourWordFrequencies = await wordFrequencyRepository.Get()
                    .Where(w => w.Date == DateOnly.FromDateTime(today))
                    .Select(w => new
                    {
                        Keyword = w.Keyword,
                        UsageCount = w.UsageCount
                    })
                    .OrderByDescending(x => x.UsageCount)
                    .Take(20)
                    .ToListAsync(cancellationToken);

                return Ok(new
                {
                    // Active counts
                    ActiveAgentCount = dashboardCache.GetActiveAgentCount(),
                    ActiveCustomerCount = dashboardCache.GetActiveCustomerCount(),
                    TotalAgents = totalAgents,
                    AvailableAgents = availableAgents,
                    UniqueAgentsLast30Days = uniqueAgentsLast30Days,

                    // Today's stats
                    Today = new
                    {
                        AgentChats = todayAgentChats,
                        AiRequests = todayAiRequests,
                        Messages = todayMessages,
                        ChatsCreated = todayChatsCreated
                    },

                    // Last 7 days stats
                    Last7Days = new
                    {
                        AgentChats = last7DaysAgentChats,
                        AiRequests = last7DaysAiRequests,
                        Messages = last7DaysMessages,
                        ChatsCreated = last7DaysChatsCreated,
                        AverageDailyChats = Math.Round(averageDailyChats7Days, 2)
                    },

                    // Last 30 days stats
                    Last30Days = new
                    {
                        AgentChats = last30DaysAgentChats,
                        AiRequests = last30DaysAiRequests,
                        Messages = last30DaysMessages,
                        TotalChats = totalChats,
                        PositiveSentimentPercentage = Math.Round(positivePercentage, 2),
                        NegativeSentimentPercentage = Math.Round(negativePercentage, 2),
                        PositiveChats = positiveChats,
                        NegativeChats = negativeChats,
                        AverageDailyChats = Math.Round(averageDailyChats30Days, 2)
                    },

                    // Charts and lists
                    DailyChartData = dailyData,
                    HourlyActivity = hourlyActivity,
                    TopAgents = topAgents,
                    TopKeywords = topKeywords,

                    // Comparisons
                    WeekOverWeekChange = Math.Round(weekOverWeekChange, 2),
                    ThisWeekChats = thisWeekChats,
                    LastWeekChats = lastWeekChats,

                    // Last 1 hour data
                    LastHour = new
                    {
                        AgentChatSuccess = lastHourAgentChatSuccess,
                        AiRequests = lastHourAiRequests,
                        ChatSentiments = lastHourChatSentiments,
                        WordFrequencies = lastHourWordFrequencies
                    }
                });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting dashboard data");
                return StatusCode(500, "An error occurred while retrieving dashboard data");
            }
        }
    }
}
