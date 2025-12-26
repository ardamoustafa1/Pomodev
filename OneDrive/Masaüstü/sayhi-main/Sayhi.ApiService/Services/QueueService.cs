using Sayhi.ApiService.Models;
using Sayhi.ApiService.Models.DTOs;
using Sayhi.ApiService.Models.Requests;
using Sayhi.ApiService.Repositories;
using Sayhi.Model;

namespace Sayhi.ApiService.Services
{
    public interface IQueueService : IBaseService<Guid, Queue, QueueDto, QueueRequest>
    {
    }

    public class QueueService(
        IQueueRepository repository,
        IMapper mapper,
        IValidator validator,
        ILogger<QueueService> logger)
        : BaseService<Guid, Queue, QueueDto, QueueRequest>(repository, mapper, validator, logger)
        , IQueueService
    {
    }
}