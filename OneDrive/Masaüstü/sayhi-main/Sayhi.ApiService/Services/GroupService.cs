using Sayhi.ApiService.Models;
using Sayhi.ApiService.Models.DTOs;
using Sayhi.ApiService.Models.Requests;
using Sayhi.ApiService.Repositories;
using Sayhi.Model;

namespace Sayhi.ApiService.Services
{
    public interface IGroupService : IBaseService<Guid, Group, GroupDto, GroupRequest>
    {
    }

    public class GroupService(
        IGroupRepository repository,
        IMapper mapper,
        IValidator validator,
        ILogger<GroupService> logger)
        : BaseService<Guid, Group, GroupDto, GroupRequest>(repository, mapper, validator, logger)
        , IGroupService
    {
    }
}