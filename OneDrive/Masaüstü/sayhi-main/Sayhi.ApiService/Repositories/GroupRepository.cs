using Microsoft.EntityFrameworkCore;
using Sayhi.ApiService.Data;
using Sayhi.Model;

namespace Sayhi.ApiService.Repositories
{
    public interface IGroupRepository : IBaseRepository<Guid, Group>
    {
    }

    public class GroupRepository(AppDbContext db)
        : BaseRepository<Guid, Group>(db), IGroupRepository
    {
        public override IQueryable<Group> Get()
        {
            return db.Groups
                .Include(m => m.Manager);
        }
    }
}
