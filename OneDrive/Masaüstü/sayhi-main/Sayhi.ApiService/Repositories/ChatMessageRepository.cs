using Microsoft.EntityFrameworkCore;
using Sayhi.ApiService.Data;
using Sayhi.Model;

namespace Sayhi.ApiService.Repositories
{
    public interface IChatMessageRepository : IBaseRepository<Guid, ChatMessage>
    {
        IQueryable<ChatMessage> GetByChatId(Guid chatId);
    }

    public class ChatMessageRepository(AppDbContext db) : BaseRepository<Guid, ChatMessage>(db), IChatMessageRepository
    {
        public override IQueryable<ChatMessage> Get()
        {
            return db.ChatMessages
                .Include(m => m.Sender);
        }

        public IQueryable<ChatMessage> GetByChatId(Guid chatId)
        {
            return Get()
                .Where(m => m.ChatId == chatId)
                .OrderBy(m => m.CreatedAt);
        }
    }
}
