using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sayhi.ApiService.Repositories.Reporting;
using Sayhi.ApiService.Features.Chat;
using Sayhi.ApiService.Data;
using Sayhi.ApiService.Repositories;
using Sayhi.Model;

namespace Sayhi.ApiService.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ReportController(
        IAgentChatRepository agentChatRepository,
        IAiRequestRepository aiRequestRepository,
        IChatSentimentRepository chatSentimentRepository,
        IWordFrequencyRepository wordFrequencyRepository,
        IDashboardCache dashboardCache,
        AppDbContext appDbContext,
        IAgentRepository agentRepository,
        IChatRepository chatRepository,
        ILogger<ReportController> logger) : ControllerBase
    {
        [HttpGet("agent-chats/daily")]
        public IActionResult GetAgentChatsDaily()
        {
            try
            {
                var result = agentChatRepository.GetDaily().ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting daily agent chats report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("agent-chats/weekly")]
        public IActionResult GetAgentChatsWeekly()
        {
            try
            {
                var result = agentChatRepository.GetWeekly().ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting weekly agent chats report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("agent-chats/monthly")]
        public IActionResult GetAgentChatsMonthly()
        {
            try
            {
                var result = agentChatRepository.GetMonthly().ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting monthly agent chats report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("agent-chats")]
        public IActionResult GetAgentChats([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var start = startDate ?? DateTime.Today.AddDays(-30);
                var end = endDate ?? DateTime.Today;
                var result = agentChatRepository.GetReport(start, end).ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting agent chats report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("ai-requests")]
        public async Task<IActionResult> GetAiRequests([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var start = startDate ?? DateTime.Today.AddDays(-30);
                var end = endDate ?? DateTime.Today;
                
                var requests = await aiRequestRepository.Get()
                    .Where(r => r.Date >= DateOnly.FromDateTime(start) && r.Date <= DateOnly.FromDateTime(end))
                    .GroupBy(r => r.Date)
                    .Select(g => new
                    {
                        Date = g.Key,
                        Count = g.Sum(x => x.Count)
                    })
                    .OrderBy(x => x.Date)
                    .ToListAsync();

                return Ok(requests);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting AI requests report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("chat-sentiments")]
        public async Task<IActionResult> GetChatSentiments([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] int? agentId)
        {
            try
            {
                var start = startDate ?? DateTime.Today.AddDays(-30);
                var end = endDate ?? DateTime.Today;
                
                var query = chatSentimentRepository.Get()
                    .Where(s => s.Date >= DateOnly.FromDateTime(start) && s.Date <= DateOnly.FromDateTime(end));

                if (agentId.HasValue)
                {
                    query = query.Where(s => s.AgentId == agentId.Value);
                }

                var sentiments = await query
                    .GroupBy(s => new { s.Date, s.AgentName })
                    .Select(g => new
                    {
                        Date = g.Key.Date,
                        AgentName = g.Key.AgentName,
                        TotalChats = g.Count(),
                        PositiveCustomerTone = g.Count(s => s.CustomerOverallTone.ToLower().Contains("positive") || s.CustomerOverallTone.ToLower().Contains("pozitif")),
                        NegativeCustomerTone = g.Count(s => s.CustomerOverallTone.ToLower().Contains("negative") || s.CustomerOverallTone.ToLower().Contains("negatif")),
                        NeutralCustomerTone = g.Count(s => !s.CustomerOverallTone.ToLower().Contains("positive") && !s.CustomerOverallTone.ToLower().Contains("negative") && !s.CustomerOverallTone.ToLower().Contains("pozitif") && !s.CustomerOverallTone.ToLower().Contains("negatif"))
                    })
                    .OrderBy(x => x.Date)
                    .ThenBy(x => x.AgentName)
                    .ToListAsync();

                return Ok(sentiments);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting chat sentiments report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("word-frequencies")]
        public async Task<IActionResult> GetWordFrequencies([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] int? topN)
        {
            try
            {
                var start = startDate ?? DateTime.Today.AddDays(-30);
                var end = endDate ?? DateTime.Today;
                var top = topN ?? 20;
                
                var words = await wordFrequencyRepository.Get()
                    .Where(w => w.Date >= DateOnly.FromDateTime(start) && w.Date <= DateOnly.FromDateTime(end))
                    .GroupBy(w => w.Keyword)
                    .Select(g => new
                    {
                        Keyword = g.Key,
                        TotalUsage = g.Sum(x => x.UsageCount)
                    })
                    .OrderByDescending(x => x.TotalUsage)
                    .Take(top)
                    .ToListAsync();

                return Ok(words);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting word frequencies report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var start = startDate ?? DateTime.Today.AddDays(-30);
                var end = endDate ?? DateTime.Today;

                var agentChatsTotal = await agentChatRepository.Get()
                    .Where(a => a.Date >= DateOnly.FromDateTime(start) && a.Date <= DateOnly.FromDateTime(end))
                    .SumAsync(a => a.Count);

                var aiRequestsTotal = await aiRequestRepository.Get()
                    .Where(a => a.Date >= DateOnly.FromDateTime(start) && a.Date <= DateOnly.FromDateTime(end))
                    .SumAsync(a => a.Count);

                var totalChats = await chatSentimentRepository.Get()
                    .Where(c => c.Date >= DateOnly.FromDateTime(start) && c.Date <= DateOnly.FromDateTime(end))
                    .CountAsync();

                var uniqueAgents = await agentChatRepository.Get()
                    .Where(a => a.Date >= DateOnly.FromDateTime(start) && a.Date <= DateOnly.FromDateTime(end))
                    .Select(a => a.AgentId)
                    .Distinct()
                    .CountAsync();

                var positiveSentiments = await chatSentimentRepository.Get()
                    .Where(c => c.Date >= DateOnly.FromDateTime(start) && c.Date <= DateOnly.FromDateTime(end) &&
                                (c.CustomerOverallTone.ToLower().Contains("positive") || c.CustomerOverallTone.ToLower().Contains("pozitif")))
                    .CountAsync();

                var summary = new
                {
                    Period = new { Start = start, End = end },
                    TotalAgentChats = agentChatsTotal,
                    TotalAiRequests = aiRequestsTotal,
                    TotalChats = totalChats,
                    UniqueAgents = uniqueAgents,
                    PositiveSentimentCount = positiveSentiments,
                    PositiveSentimentPercentage = totalChats > 0 ? (double)positiveSentiments / totalChats * 100 : 0,
                    ActiveAgentCount = dashboardCache.GetActiveAgentCount(),
                    ActiveCustomerCount = dashboardCache.GetActiveCustomerCount()
                };

                return Ok(summary);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting summary report");
                return StatusCode(500, "An error occurred while retrieving the summary");
            }
        }

        [HttpGet("active-agents")]
        public async Task<IActionResult> GetActiveAgentsReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var start = startDate ?? DateTime.Today.AddDays(-30);
                var end = endDate ?? DateTime.Today;

                var activeAgents = await agentChatRepository.Get()
                    .Where(a => a.Date >= DateOnly.FromDateTime(start) && a.Date <= DateOnly.FromDateTime(end))
                    .GroupBy(a => new { a.AgentId, a.AgentName })
                    .Select(g => new
                    {
                        AgentId = g.Key.AgentId,
                        AgentName = g.Key.AgentName,
                        TotalActiveDays = g.Count(),
                        TotalChats = g.Sum(x => x.Count),
                        AverageDailyChats = (int)g.Average(x => x.Count)
                    })
                    .OrderByDescending(x => x.TotalChats)
                    .ToListAsync();

                return Ok(activeAgents);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting active agents report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("agent-performance")]
        public async Task<IActionResult> GetAgentPerformanceReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] int? topN)
        {
            try
            {
                var start = startDate ?? DateTime.Today.AddDays(-30);
                var end = endDate ?? DateTime.Today;
                var top = topN ?? 10;

                var performance = await agentChatRepository.Get()
                    .Where(a => a.Date >= DateOnly.FromDateTime(start) && a.Date <= DateOnly.FromDateTime(end))
                    .GroupBy(a => new { a.AgentId, a.AgentName })
                    .Select(g => new
                    {
                        AgentId = g.Key.AgentId,
                        AgentName = g.Key.AgentName,
                        TotalChats = g.Sum(x => x.Count),
                        AverageDailyChats = (int)g.Average(x => x.Count),
                        MaxDailyChats = g.Max(x => x.Count),
                        MinDailyChats = g.Min(x => x.Count),
                        ActiveDays = g.Count()
                    })
                    .OrderByDescending(x => x.TotalChats)
                    .Take(top)
                    .ToListAsync();

                return Ok(performance);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting agent performance report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("agent-availability")]
        public async Task<IActionResult> GetAgentAvailabilityReport()
        {
            try
            {
                var agents = await agentRepository.Get()
                    .Select(a => new
                    {
                        AgentId = a.Id,
                        AgentName = a.Name,
                        Status = a.Status.ToString(),
                        IsAvailable = a.IsAvailable,
                        IsActive = a.IsActive,
                        LastActivityAt = a.LastActivityAt
                    })
                    .ToListAsync();

                var availability = new
                {
                    TotalAgents = agents.Count,
                    AvailableAgents = agents.Count(a => a.IsAvailable),
                    BusyAgents = agents.Count(a => a.Status.ToString() == "Busy"),
                    AwayAgents = agents.Count(a => a.Status.ToString() == "Away"),
                    Agents = agents
                };

                return Ok(availability);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting agent availability report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("hourly-activity")]
        public async Task<IActionResult> GetHourlyActivityReport([FromQuery] DateTime? date)
        {
            try
            {
                var targetDate = date ?? DateTime.Today;
                var startOfDay = targetDate.Date;
                var endOfDay = startOfDay.AddDays(1);

                var hourlyData = new List<object>();
                for (int hour = 0; hour < 24; hour++)
                {
                    var hourStart = startOfDay.AddHours(hour);
                    var hourEnd = hourStart.AddHours(1);

                    var chats = await appDbContext.Chats
                        .Where(c => c.CreatedAt >= hourStart && c.CreatedAt < hourEnd)
                        .CountAsync();

                    var messages = await appDbContext.ChatMessages
                        .Where(m => m.CreatedAt >= hourStart && m.CreatedAt < hourEnd)
                        .CountAsync();

                    hourlyData.Add(new
                    {
                        Hour = hour,
                        HourLabel = $"{hour:00}:00",
                        Chats = chats,
                        Messages = messages
                    });
                }

                return Ok(hourlyData);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting hourly activity report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("daily-activity")]
        public async Task<IActionResult> GetDailyActivityReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var start = startDate ?? DateTime.Today.AddDays(-30);
                var end = endDate ?? DateTime.Today;

                var dailyData = new List<object>();
                var currentDate = start.Date;
                while (currentDate <= end.Date)
                {
                    var dayStart = currentDate;
                    var dayEnd = currentDate.AddDays(1);

                    var chats = await appDbContext.Chats
                        .Where(c => c.CreatedAt >= dayStart && c.CreatedAt < dayEnd)
                        .CountAsync();

                    var messages = await appDbContext.ChatMessages
                        .Where(m => m.CreatedAt >= dayStart && m.CreatedAt < dayEnd)
                        .CountAsync();

                    var agentChats = await agentChatRepository.Get()
                        .Where(a => a.Date == DateOnly.FromDateTime(currentDate))
                        .SumAsync(a => a.Count);

                    var aiRequests = await aiRequestRepository.Get()
                        .Where(a => a.Date == DateOnly.FromDateTime(currentDate))
                        .SumAsync(a => a.Count);

                    dailyData.Add(new
                    {
                        Date = currentDate.ToString("yyyy-MM-dd"),
                        DayName = currentDate.ToString("dddd"),
                        Chats = chats,
                        Messages = messages,
                        AgentChats = agentChats,
                        AiRequests = aiRequests
                    });

                    currentDate = currentDate.AddDays(1);
                }

                return Ok(dailyData);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting daily activity report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("weekly-activity")]
        public async Task<IActionResult> GetWeeklyActivityReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var start = startDate ?? DateTime.Today.AddDays(-90);
                var end = endDate ?? DateTime.Today;

                var weeklyData = await agentChatRepository.Get()
                    .Where(a => a.Date >= DateOnly.FromDateTime(start) && a.Date <= DateOnly.FromDateTime(end))
                    .GroupBy(a => new
                    {
                        Year = a.Date.Year,
                        Week = System.Globalization.CultureInfo.CurrentCulture.Calendar.GetWeekOfYear(
                            a.Date.ToDateTime(TimeOnly.MinValue),
                            System.Globalization.CalendarWeekRule.FirstDay,
                            DayOfWeek.Monday)
                    })
                    .Select(g => new
                    {
                        Year = g.Key.Year,
                        Week = g.Key.Week,
                        WeekLabel = $"Hafta {g.Key.Week}",
                        TotalChats = g.Sum(x => x.Count),
                        AverageDailyChats = (int)g.Average(x => x.Count),
                        UniqueAgents = g.Select(x => x.AgentId).Distinct().Count()
                    })
                    .OrderBy(x => x.Year)
                    .ThenBy(x => x.Week)
                    .ToListAsync();

                return Ok(weeklyData);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting weekly activity report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("sentiment-trend")]
        public async Task<IActionResult> GetSentimentTrendReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var start = startDate ?? DateTime.Today.AddDays(-30);
                var end = endDate ?? DateTime.Today;

                var trend = await chatSentimentRepository.Get()
                    .Where(s => s.Date >= DateOnly.FromDateTime(start) && s.Date <= DateOnly.FromDateTime(end))
                    .GroupBy(s => s.Date)
                    .Select(g => new
                    {
                        Date = g.Key,
                        TotalChats = g.Count(),
                        PositiveCount = g.Count(s => s.CustomerOverallTone.ToLower().Contains("positive") || s.CustomerOverallTone.ToLower().Contains("pozitif")),
                        NegativeCount = g.Count(s => s.CustomerOverallTone.ToLower().Contains("negative") || s.CustomerOverallTone.ToLower().Contains("negatif")),
                        NeutralCount = g.Count(s => !s.CustomerOverallTone.ToLower().Contains("positive") && !s.CustomerOverallTone.ToLower().Contains("negative") && !s.CustomerOverallTone.ToLower().Contains("pozitif") && !s.CustomerOverallTone.ToLower().Contains("negatif")),
                        PositivePercentage = g.Count() > 0 ? (double)g.Count(s => s.CustomerOverallTone.ToLower().Contains("positive") || s.CustomerOverallTone.ToLower().Contains("pozitif")) / g.Count() * 100 : 0
                    })
                    .OrderBy(x => x.Date)
                    .ToListAsync();

                return Ok(trend);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting sentiment trend report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("ai-usage-trend")]
        public async Task<IActionResult> GetAiUsageTrendReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var start = startDate ?? DateTime.Today.AddDays(-30);
                var end = endDate ?? DateTime.Today;

                var trend = await aiRequestRepository.Get()
                    .Where(a => a.Date >= DateOnly.FromDateTime(start) && a.Date <= DateOnly.FromDateTime(end))
                    .GroupBy(a => a.Date)
                    .Select(g => new
                    {
                        Date = g.Key,
                        TotalRequests = g.Sum(x => x.Count),
                        AverageRequests = (int)g.Average(x => x.Count)
                    })
                    .OrderBy(x => x.Date)
                    .ToListAsync();

                return Ok(trend);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting AI usage trend report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("top-agents")]
        public async Task<IActionResult> GetTopAgentsReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] int? topN)
        {
            try
            {
                var start = startDate ?? DateTime.Today.AddDays(-30);
                var end = endDate ?? DateTime.Today;
                var top = topN ?? 10;

                var topAgents = await agentChatRepository.Get()
                    .Where(a => a.Date >= DateOnly.FromDateTime(start) && a.Date <= DateOnly.FromDateTime(end))
                    .GroupBy(a => new { a.AgentId, a.AgentName })
                    .Select(g => new
                    {
                        AgentId = g.Key.AgentId,
                        AgentName = g.Key.AgentName,
                        TotalChats = g.Sum(x => x.Count),
                        AverageDailyChats = (int)g.Average(x => x.Count),
                        MaxDailyChats = g.Max(x => x.Count),
                        ActiveDays = g.Count()
                    })
                    .OrderByDescending(x => x.TotalChats)
                    .Take(top)
                    .ToListAsync();

                return Ok(topAgents);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting top agents report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("least-active-agents")]
        public async Task<IActionResult> GetLeastActiveAgentsReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] int? topN)
        {
            try
            {
                var start = startDate ?? DateTime.Today.AddDays(-30);
                var end = endDate ?? DateTime.Today;
                var top = topN ?? 10;

                var leastActive = await agentChatRepository.Get()
                    .Where(a => a.Date >= DateOnly.FromDateTime(start) && a.Date <= DateOnly.FromDateTime(end))
                    .GroupBy(a => new { a.AgentId, a.AgentName })
                    .Select(g => new
                    {
                        AgentId = g.Key.AgentId,
                        AgentName = g.Key.AgentName,
                        TotalChats = g.Sum(x => x.Count),
                        AverageDailyChats = (int)g.Average(x => x.Count),
                        ActiveDays = g.Count()
                    })
                    .OrderBy(x => x.TotalChats)
                    .Take(top)
                    .ToListAsync();

                return Ok(leastActive);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting least active agents report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("chat-completion-rate")]
        public async Task<IActionResult> GetChatCompletionRateReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var start = startDate ?? DateTime.Today.AddDays(-30);
                var end = endDate ?? DateTime.Today;

                var totalChats = await chatSentimentRepository.Get()
                    .Where(c => c.Date >= DateOnly.FromDateTime(start) && c.Date <= DateOnly.FromDateTime(end))
                    .CountAsync();

                var chatsWithPositiveSentiment = await chatSentimentRepository.Get()
                    .Where(c => c.Date >= DateOnly.FromDateTime(start) && c.Date <= DateOnly.FromDateTime(end) &&
                                (c.CustomerOverallTone.ToLower().Contains("positive") || c.CustomerOverallTone.ToLower().Contains("pozitif")))
                    .CountAsync();

                var completionRate = totalChats > 0 ? (double)chatsWithPositiveSentiment / totalChats * 100 : 0;

                var result = new
                {
                    TotalChats = totalChats,
                    CompletedChats = chatsWithPositiveSentiment,
                    CompletionRate = Math.Round(completionRate, 2),
                    IncompleteChats = totalChats - chatsWithPositiveSentiment
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting chat completion rate report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("agent-sentiment-analysis")]
        public async Task<IActionResult> GetAgentSentimentAnalysisReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var start = startDate ?? DateTime.Today.AddDays(-30);
                var end = endDate ?? DateTime.Today;

                var analysis = await chatSentimentRepository.Get()
                    .Where(s => s.Date >= DateOnly.FromDateTime(start) && s.Date <= DateOnly.FromDateTime(end))
                    .GroupBy(s => new { s.AgentId, s.AgentName })
                    .Select(g => new
                    {
                        AgentId = g.Key.AgentId,
                        AgentName = g.Key.AgentName,
                        TotalChats = g.Count(),
                        PositiveSentimentCount = g.Count(s => s.CustomerOverallTone.ToLower().Contains("positive") || s.CustomerOverallTone.ToLower().Contains("pozitif")),
                        NegativeSentimentCount = g.Count(s => s.CustomerOverallTone.ToLower().Contains("negative") || s.CustomerOverallTone.ToLower().Contains("negatif")),
                        NeutralSentimentCount = g.Count(s => !s.CustomerOverallTone.ToLower().Contains("positive") && !s.CustomerOverallTone.ToLower().Contains("negative") && !s.CustomerOverallTone.ToLower().Contains("pozitif") && !s.CustomerOverallTone.ToLower().Contains("negatif")),
                        PositivePercentage = g.Count() > 0 ? (double)g.Count(s => s.CustomerOverallTone.ToLower().Contains("positive") || s.CustomerOverallTone.ToLower().Contains("pozitif")) / g.Count() * 100 : 0
                    })
                    .OrderByDescending(x => x.PositivePercentage)
                    .ToListAsync();

                return Ok(analysis);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting agent sentiment analysis report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("message-statistics")]
        public async Task<IActionResult> GetMessageStatisticsReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var start = startDate ?? DateTime.Today.AddDays(-30);
                var end = endDate ?? DateTime.Today.AddDays(1);

                var totalMessages = await appDbContext.ChatMessages
                    .Where(m => m.CreatedAt >= start && m.CreatedAt < end)
                    .CountAsync();

                var totalChats = await appDbContext.Chats
                    .Where(c => c.CreatedAt >= start && c.CreatedAt < end)
                    .CountAsync();

                var averageMessagesPerChat = totalChats > 0 ? (double)totalMessages / totalChats : 0;

                var messagesByDay = await appDbContext.ChatMessages
                    .Where(m => m.CreatedAt >= start && m.CreatedAt < end)
                    .GroupBy(m => m.CreatedAt.Date)
                    .Select(g => new
                    {
                        Date = g.Key,
                        MessageCount = g.Count()
                    })
                    .OrderBy(x => x.Date)
                    .ToListAsync();

                var result = new
                {
                    TotalMessages = totalMessages,
                    TotalChats = totalChats,
                    AverageMessagesPerChat = Math.Round(averageMessagesPerChat, 2),
                    MessagesByDay = messagesByDay
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting message statistics report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("customer-satisfaction")]
        public async Task<IActionResult> GetCustomerSatisfactionReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var start = startDate ?? DateTime.Today.AddDays(-30);
                var end = endDate ?? DateTime.Today;

                var totalChats = await chatSentimentRepository.Get()
                    .Where(c => c.Date >= DateOnly.FromDateTime(start) && c.Date <= DateOnly.FromDateTime(end))
                    .CountAsync();

                var positiveChats = await chatSentimentRepository.Get()
                    .Where(c => c.Date >= DateOnly.FromDateTime(start) && c.Date <= DateOnly.FromDateTime(end) &&
                                (c.CustomerOverallTone.ToLower().Contains("positive") || c.CustomerOverallTone.ToLower().Contains("pozitif")))
                    .CountAsync();

                var negativeChats = await chatSentimentRepository.Get()
                    .Where(c => c.Date >= DateOnly.FromDateTime(start) && c.Date <= DateOnly.FromDateTime(end) &&
                                (c.CustomerOverallTone.ToLower().Contains("negative") || c.CustomerOverallTone.ToLower().Contains("negatif")))
                    .CountAsync();

                var neutralChats = totalChats - positiveChats - negativeChats;

                var satisfactionScore = totalChats > 0 ? (double)(positiveChats * 100 + neutralChats * 50) / totalChats : 0;

                var result = new
                {
                    TotalChats = totalChats,
                    PositiveChats = positiveChats,
                    NegativeChats = negativeChats,
                    NeutralChats = neutralChats,
                    SatisfactionScore = Math.Round(satisfactionScore, 2),
                    PositivePercentage = totalChats > 0 ? Math.Round((double)positiveChats / totalChats * 100, 2) : 0,
                    NegativePercentage = totalChats > 0 ? Math.Round((double)negativeChats / totalChats * 100, 2) : 0
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting customer satisfaction report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("peak-hours")]
        public async Task<IActionResult> GetPeakHoursReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var start = startDate ?? DateTime.Today.AddDays(-30);
                var end = endDate ?? DateTime.Today.AddDays(1);

                var hourlyStats = new List<object>();
                for (int hour = 0; hour < 24; hour++)
                {
                    var chats = await appDbContext.Chats
                        .Where(c => c.CreatedAt >= start && c.CreatedAt < end && c.CreatedAt.Hour == hour)
                        .CountAsync();

                    var messages = await appDbContext.ChatMessages
                        .Where(m => m.CreatedAt >= start && m.CreatedAt < end && m.CreatedAt.Hour == hour)
                        .CountAsync();

                    hourlyStats.Add(new
                    {
                        Hour = hour,
                        HourLabel = $"{hour:00}:00",
                        Chats = chats,
                        Messages = messages,
                        TotalActivity = chats + messages
                    });
                }

                var peakHour = hourlyStats.OrderByDescending(h => ((dynamic)h).TotalActivity).First();

                var result = new
                {
                    HourlyStats = hourlyStats,
                    PeakHour = peakHour
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting peak hours report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("agent-comparison")]
        public async Task<IActionResult> GetAgentComparisonReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var start = startDate ?? DateTime.Today.AddDays(-30);
                var end = endDate ?? DateTime.Today;

                var comparison = await agentChatRepository.Get()
                    .Where(a => a.Date >= DateOnly.FromDateTime(start) && a.Date <= DateOnly.FromDateTime(end))
                    .GroupBy(a => new { a.AgentId, a.AgentName })
                    .Select(g => new
                    {
                        AgentId = g.Key.AgentId,
                        AgentName = g.Key.AgentName,
                        TotalChats = g.Sum(x => x.Count),
                        AverageDailyChats = (int)g.Average(x => x.Count),
                        MaxDailyChats = g.Max(x => x.Count),
                        MinDailyChats = g.Min(x => x.Count),
                        ActiveDays = g.Count(),
                        Consistency = g.Count() > 0 ? (double)g.Count(x => x.Count > 0) / g.Count() * 100 : 0
                    })
                    .OrderByDescending(x => x.TotalChats)
                    .ToListAsync();

                var overallAverage = comparison.Count > 0 ? comparison.Average(x => x.AverageDailyChats) : 0;

                var result = new
                {
                    Agents = comparison,
                    OverallAverageDailyChats = Math.Round(overallAverage, 2),
                    TotalAgents = comparison.Count,
                    AboveAverageAgents = comparison.Count(a => a.AverageDailyChats > overallAverage),
                    BelowAverageAgents = comparison.Count(a => a.AverageDailyChats < overallAverage)
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting agent comparison report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("daily-agent-chat-success")]
        public async Task<IActionResult> GetDailyAgentChatSuccessReport([FromQuery] DateTime? date)
        {
            try
            {
                var targetDate = date ?? DateTime.Today;
                var dateOnly = DateOnly.FromDateTime(targetDate);

                var report = await agentChatRepository.Get()
                    .Where(a => a.Date == dateOnly)
                    .Select(a => new
                    {
                        Date = a.Date.ToString("yyyy-MM-dd"),
                        AgentName = a.AgentName,
                        ChatCount = a.Count
                    })
                    .OrderByDescending(x => x.ChatCount)
                    .ToListAsync();

                return Ok(report);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting daily agent chat success report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("daily-ai-requests")]
        public async Task<IActionResult> GetDailyAiRequestsReport([FromQuery] DateTime? date)
        {
            try
            {
                var targetDate = date ?? DateTime.Today;
                var startOfDay = targetDate.Date;
                var endOfDay = startOfDay.AddDays(1);

                // AI request'ler için AppDbContext'ten Chat ve ChatMessage verilerini kullanıyoruz
                var report = await (from msg in appDbContext.ChatMessages
                                   where msg.CreatedAt >= startOfDay && msg.CreatedAt < endOfDay &&
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
                                       Date = startOfDay.ToString("yyyy-MM-dd"),
                                       AgentName = g.Key.Name ?? "Bilinmeyen",
                                       ChatId = g.Key.ChatId.ToString(),
                                       RequestCount = g.Count()
                                   })
                                   .ToListAsync();

                return Ok(report);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting daily AI requests report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("daily-chat-sentiment-detailed")]
        public async Task<IActionResult> GetDailyChatSentimentDetailedReport([FromQuery] DateTime? date)
        {
            try
            {
                var targetDate = date ?? DateTime.Today;
                var dateOnly = DateOnly.FromDateTime(targetDate);

                var report = await chatSentimentRepository.Get()
                    .Where(s => s.Date == dateOnly)
                    .Select(s => new
                    {
                        Date = s.Date.ToString("yyyy-MM-dd"),
                        AgentName = s.AgentName,
                        ChatId = s.ChatId,
                        CustomerOverallTone = s.CustomerOverallTone,
                        AgentOverallTone = s.AgentOverallTone
                    })
                    .OrderBy(x => x.AgentName)
                    .ThenBy(x => x.ChatId)
                    .ToListAsync();

                return Ok(report);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting daily chat sentiment detailed report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("daily-word-frequency-detailed")]
        public async Task<IActionResult> GetDailyWordFrequencyDetailedReport([FromQuery] DateTime? date, [FromQuery] int? topN)
        {
            try
            {
                var targetDate = date ?? DateTime.Today;
                var dateOnly = DateOnly.FromDateTime(targetDate);
                var top = topN ?? 50;

                var report = await wordFrequencyRepository.Get()
                    .Where(w => w.Date == dateOnly)
                    .Select(w => new
                    {
                        Date = w.Date.ToString("yyyy-MM-dd"),
                        Keyword = w.Keyword,
                        UsageCount = w.UsageCount
                    })
                    .OrderByDescending(x => x.UsageCount)
                    .Take(top)
                    .ToListAsync();

                return Ok(report);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting daily word frequency detailed report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("hourly-agent-chat-success")]
        public async Task<IActionResult> GetHourlyAgentChatSuccessReport()
        {
            try
            {
                var oneHourAgo = DateTime.UtcNow.AddHours(-1);

                // Son 1 saatteki agent chat'lerini bulmak için AppDbContext kullanıyoruz
                // AgentChat tablosunda saat bilgisi yok, bu yüzden bugünkü verileri kullanıyoruz
                var today = DateTime.Today;
                var report = await agentChatRepository.Get()
                    .Where(a => a.Date == DateOnly.FromDateTime(today))
                    .Select(a => new
                    {
                        AgentName = a.AgentName,
                        ChatCount = a.Count
                    })
                    .OrderByDescending(x => x.ChatCount)
                    .ToListAsync();

                return Ok(report);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting hourly agent chat success report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("hourly-ai-requests")]
        public async Task<IActionResult> GetHourlyAiRequestsReport()
        {
            try
            {
                var oneHourAgo = DateTime.UtcNow.AddHours(-1);

                // Son 1 saatteki AI request'leri için AppDbContext'ten Chat ve ChatMessage verilerini kullanıyoruz
                var aiRequests = await appDbContext.ChatMessages
                    .Where(m => m.CreatedAt >= oneHourAgo && 
                                m.SenderId == Guid.Parse("00000000-0000-0000-0000-000000000041")) // AI User ID
                    .GroupBy(m => new { m.ChatId })
                    .Select(g => new
                    {
                        ChatId = g.Key.ChatId,
                        RequestCount = g.Count()
                    })
                    .ToListAsync();

                // Agent bilgisi için ChatParticipants kullanıyoruz
                var report = await (from msg in appDbContext.ChatMessages
                                   where msg.CreatedAt >= oneHourAgo && 
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
                                   .ToListAsync();

                return Ok(report);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting hourly AI requests report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("hourly-chat-sentiment")]
        public async Task<IActionResult> GetHourlyChatSentimentReport()
        {
            try
            {
                var oneHourAgo = DateTime.UtcNow.AddHours(-1);
                var today = DateOnly.FromDateTime(DateTime.Today);

                // Son 1 saatteki sentiment verileri için bugünkü verileri kullanıyoruz
                // (Reporting tablosunda saat bilgisi yok)
                var report = await chatSentimentRepository.Get()
                    .Where(s => s.Date == today)
                    .Select(s => new
                    {
                        AgentName = s.AgentName,
                        ChatId = s.ChatId,
                        CustomerOverallTone = s.CustomerOverallTone,
                        AgentOverallTone = s.AgentOverallTone
                    })
                    .OrderBy(x => x.AgentName)
                    .ThenBy(x => x.ChatId)
                    .ToListAsync();

                return Ok(report);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting hourly chat sentiment report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }

        [HttpGet("hourly-word-frequency")]
        public async Task<IActionResult> GetHourlyWordFrequencyReport([FromQuery] int? topN)
        {
            try
            {
                var oneHourAgo = DateTime.UtcNow.AddHours(-1);
                var today = DateOnly.FromDateTime(DateTime.Today);
                var top = topN ?? 20;

                // Son 1 saatteki kelime kullanımları için bugünkü verileri kullanıyoruz
                var report = await wordFrequencyRepository.Get()
                    .Where(w => w.Date == today)
                    .Select(w => new
                    {
                        Keyword = w.Keyword,
                        UsageCount = w.UsageCount
                    })
                    .OrderByDescending(x => x.UsageCount)
                    .Take(top)
                    .ToListAsync();

                return Ok(report);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting hourly word frequency report");
                return StatusCode(500, "An error occurred while retrieving the report");
            }
        }
    }
}

