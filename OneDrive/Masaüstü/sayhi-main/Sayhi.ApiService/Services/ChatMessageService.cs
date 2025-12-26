using Microsoft.EntityFrameworkCore;
using Sayhi.ApiService.Models;
using Sayhi.ApiService.Models.DTOs;
using Sayhi.ApiService.Models.Requests;
using Sayhi.ApiService.Repositories;
using Sayhi.Model;

namespace Sayhi.ApiService.Services
{
    public interface IChatMessageService : IBaseService<Guid, ChatMessage, ChatMessageDto, IRequest<Guid, ChatMessage>>
    {
        Task<IEnumerable<ChatMessageDto>> GetByChatId(Guid chatId, Guid userId, CancellationToken cancellationToken = default);
    }

    public class ChatMessageService(
        IChatMessageRepository repository,
        IMapper mapper,
        IValidator validator,
        ILogger<ChatMessageService> logger)
        : BaseService<Guid, ChatMessage, ChatMessageDto, IRequest<Guid, ChatMessage>>(repository, mapper, validator, logger)
        , IChatMessageService
    {
        public async Task<IEnumerable<ChatMessageDto>> GetByChatId(Guid chatId, Guid userId, CancellationToken cancellationToken = default)
        {
            return await repository
                .GetByChatId(chatId)
                .Select(m => ChatMessageDto.Create(m, userId))
                .ToListAsync(cancellationToken);
        }
    }
}