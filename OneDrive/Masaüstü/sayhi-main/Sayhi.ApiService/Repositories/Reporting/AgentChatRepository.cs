using Sayhi.ApiService.Data;
using Sayhi.Model.Reports;

namespace Sayhi.ApiService.Repositories.Reporting
{
    public interface IAgentChatRepository : IBaseRepository<int, AgentChat>
    {
        IEnumerable<object> GetDaily();
        IEnumerable<object> GetWeekly();
        IEnumerable<object> GetMonthly();
        IEnumerable<object> GetReport(DateTime start, DateTime finish);
    }

    public class AgentChatRepository(ReportingDbContext db)
        : BaseRepository<int, AgentChat>(db), IAgentChatRepository
    {
        public IEnumerable<object> GetReport(DateTime start, DateTime finish)
        {
            return db.AgentChats
                .Where(d => d.Date >= DateOnly.FromDateTime(start) && d.Date < DateOnly.FromDateTime(finish))
                .GroupBy(d => d.AgentId)
                .Select(g => new {
                    AgentName = g.First().AgentName,
                    TotalChats = g.Sum(x => x.Count),
                    AverageDailyChat = (int)g.Average(x => x.Count)
                })
                //.ToListAsync()
                ;
        }

        public IEnumerable<object> GetDaily()
        {
            return GetReport(DateTime.Today.AddDays(-1), DateTime.Today);
        }

        public IEnumerable<object> GetWeekly()
        {
            return GetReport(DateTime.Today.AddDays(-7), DateTime.Today);
        }

        public IEnumerable<object> GetMonthly()
        {
            return GetReport(DateTime.Today.AddMonths(-1), DateTime.Today);
        }
    }
}
