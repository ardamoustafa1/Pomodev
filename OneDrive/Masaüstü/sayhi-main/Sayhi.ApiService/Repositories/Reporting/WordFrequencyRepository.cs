using Sayhi.ApiService.Data;
using Sayhi.Model.Reports;

namespace Sayhi.ApiService.Repositories.Reporting
{
    public interface IWordFrequencyRepository : IBaseRepository<int, WordFrequency>
    {
    }

    public class WordFrequencyRepository(ReportingDbContext db)
        : BaseRepository<int, WordFrequency>(db), IWordFrequencyRepository
    {
    }
}
