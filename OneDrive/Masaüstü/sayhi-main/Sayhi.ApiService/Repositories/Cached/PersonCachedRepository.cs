using System.Collections.Concurrent;
using System.Linq.Expressions;
using Sayhi.Model;

namespace Sayhi.ApiService.Repositories.Cached
{
    public class PersonCachedRepository(
        IPersonRepository repository,
        ILogger<PersonCachedRepository> logger)
    {
        private static readonly ConcurrentDictionary<Guid, Person> cache = new();

        public async Task<Person?> Find(Expression<Func<Person, bool>> filter, CancellationToken cancellationToken = default)
        {
            Person? person = cache.Values.SingleOrDefault(filter.Compile());
            if (person != null)
            {
                return person;
            }

            person = await repository.Find(filter, cancellationToken);

            if (person != null)
            {
                cache.TryAdd(person.Id, person);
            }

            return person;
        }

        public async Task<Person> Add(Person item, CancellationToken cancellationToken = default)
        {
            Person person = await repository.Add(item, cancellationToken);

            cache.TryAdd(person.Id, person);

            return person;
        }

        public async Task<Person> GetOrCreate(string name, CancellationToken cancellationToken = default)
        {
            Person? person = await Find(p => p.Name == name, cancellationToken);

            if (person == null)
            {
                person = await Add(new Person() { Name = name });
            }

            return person;
        }
    }
}