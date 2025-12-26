using Sayhi.ApiService.Data;
using Sayhi.Model.Reports;

namespace Sayhi.ApiService.Repositories.Reporting
{
    public interface IAiRequestRepository : IBaseRepository<int, AiRequest>
    {
    }

    public class AiRequestRepository(ReportingDbContext db)
        : BaseRepository<int, AiRequest>(db), IAiRequestRepository
    {
    }
}
