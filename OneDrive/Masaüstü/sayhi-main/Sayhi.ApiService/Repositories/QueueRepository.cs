using Sayhi.ApiService.Data;
using Sayhi.Model;

namespace Sayhi.ApiService.Repositories
{
    public interface IQueueRepository : IBaseRepository<Guid, Queue>
    {
    }

    public class QueueRepository(AppDbContext db)
        : BaseRepository<Guid, Queue>(db), IQueueRepository
    {
    }
}
