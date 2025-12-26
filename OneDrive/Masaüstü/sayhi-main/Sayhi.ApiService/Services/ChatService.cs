using Microsoft.EntityFrameworkCore;
using Sayhi.ApiService.Models;
using Sayhi.ApiService.Models.DTOs;
using Sayhi.ApiService.Models.Requests;
using Sayhi.ApiService.Repositories;
using Sayhi.Model;

namespace Sayhi.ApiService.Services
{
    public interface IChatService : IBaseService<Guid, Chat, ChatDto, IRequest<Guid, Chat>>
    {
        Task<IEnumerable<ChatDto>> GetByUser(Guid userId, CancellationToken cancellationToken = default);
    }

    public class ChatService(
        IChatRepository repository,
        IMapper mapper,
        IValidator validator,
        ILogger<ChatService> logger)
        : BaseService<Guid, Chat, ChatDto, IRequest<Guid, Chat>>(repository, mapper, validator, logger)
        , IChatService
    {
        public async Task<IEnumerable<ChatDto>> GetByUser(Guid userId, CancellationToken cancellationToken = default)
        {
            try
            {
                //Console.WriteLine("...........");
                return await repository
                    .GetByUser(userId)
                    .Select(c => ChatDto.Create(c, userId))
                    .ToListAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error while getting chats by user");
                throw;
            }
        }
    }
}