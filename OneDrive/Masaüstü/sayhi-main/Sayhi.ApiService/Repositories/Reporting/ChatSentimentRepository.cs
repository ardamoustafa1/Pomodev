using Sayhi.ApiService.Data;
using Sayhi.Model.Reports;

namespace Sayhi.ApiService.Repositories.Reporting
{
    public interface IChatSentimentRepository : IBaseRepository<int, ChatSentiment>
    {
    }

    public class ChatSentimentRepository(ReportingDbContext db)
        : BaseRepository<int, ChatSentiment>(db), IChatSentimentRepository
    {
    }
}
