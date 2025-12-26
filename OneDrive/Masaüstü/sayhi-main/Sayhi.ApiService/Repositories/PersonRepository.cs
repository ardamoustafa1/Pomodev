using Sayhi.ApiService.Data;
using Sayhi.Model;

namespace Sayhi.ApiService.Repositories
{
    public interface IPersonRepository : IBaseRepository<Guid, Person>
    {
        Task<Person?> FindByIdOrNameOrEmail(string q, CancellationToken cancellationToken = default);
    }

    public class PersonRepository(AppDbContext db) : BaseRepository<Guid, Person>(db), IPersonRepository
    {
        public async Task<Person?> FindByIdOrNameOrEmail(string q, CancellationToken cancellationToken = default)
        {
            return Guid.TryParse(q, out Guid userId)
                //? await base.Find(p => p.Id == userId, cancellationToken)
                ? await base.GetById(userId, cancellationToken)
                : await base.Find(p => p.Name == q || p.Email == q, cancellationToken);
        }
    }
}
