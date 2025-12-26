using Sayhi.ApiService.Data;
using Sayhi.Model;

namespace Sayhi.ApiService.Repositories
{
    public interface ISkillRepository : IBaseRepository<Guid, Skill>
    {
    }

    public class SkillRepository(AppDbContext db)
        : BaseRepository<Guid, Skill>(db), ISkillRepository
    {
    }
}
