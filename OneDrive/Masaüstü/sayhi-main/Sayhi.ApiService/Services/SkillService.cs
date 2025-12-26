using Sayhi.ApiService.Models;
using Sayhi.ApiService.Models.DTOs;
using Sayhi.ApiService.Models.Requests;
using Sayhi.ApiService.Repositories;
using Sayhi.Model;

namespace Sayhi.ApiService.Services
{
    public interface ISkillService : IBaseService<Guid, Skill, SkillDto, SkillRequest>
    {
    }

    public class SkillService(
        ISkillRepository repository,
        IMapper mapper,
        IValidator validator,
        ILogger<SkillService> logger)
        : BaseService<Guid, Skill, SkillDto, SkillRequest>(repository, mapper, validator, logger)
        , ISkillService
    {
    }
}