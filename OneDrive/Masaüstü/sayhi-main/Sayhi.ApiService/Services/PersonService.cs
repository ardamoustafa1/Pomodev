using Sayhi.ApiService.Models;
using Sayhi.ApiService.Models.DTOs;
using Sayhi.ApiService.Models.Requests;
using Sayhi.ApiService.Repositories;
using Sayhi.Model;

namespace Sayhi.ApiService.Services
{
    public interface IPersonService : IBaseService<Guid, Person, PersonDto, PersonRequest>
    {
    }

    public class PersonService(
        IPersonRepository repository,
        IMapper mapper,
        IValidator validator,
        ILogger<PersonService> logger)
        : BaseService<Guid, Person, PersonDto, PersonRequest>(repository, mapper, validator, logger)
        , IPersonService
    {
    }
}