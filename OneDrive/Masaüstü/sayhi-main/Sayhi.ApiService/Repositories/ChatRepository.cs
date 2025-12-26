using Microsoft.EntityFrameworkCore;
using Sayhi.ApiService.Data;
using Sayhi.Model;

namespace Sayhi.ApiService.Repositories
{
    public interface IChatRepository : IBaseRepository<Guid, Chat>
    {
        //Task<IQueryable<Chat>> GetByUser(Guid userId, CancellationToken cancellationToken = default);
        IQueryable<Chat> GetByUser(Guid userId);
        IQueryable<Chat> GetCommonChats(Guid participantId1, Guid participantId2);
        Task<int> AddParticipants(Guid chatId, Guid[] participantIds, CancellationToken cancellationToken = default);
        Task<int> RemoveParticipants(Guid chatId, Guid[] participantIds, CancellationToken cancellationToken = default);
    }

    public class ChatRepository(AppDbContext db) : BaseRepository<Guid, Chat>(db), IChatRepository
    {
        public override IQueryable<Chat> Get()
        {
            return db
                .Chats
                .Include(c => c.Participants)
                    .ThenInclude(cp => cp.Person)
                .Include(c => c.Messages)
                    .ThenInclude(m => m.Sender);
        }

        public override async Task<Chat?> GetById(Guid id, CancellationToken cancellationToken = default)
        {
            return await Get()
                .SingleOrDefaultAsync(i => i.Id == id, cancellationToken);
        }

        public IQueryable<Chat> GetByUser(Guid userId)
        {
            return Get()
                .Where(c => c.Participants.Any(p => p.PersonId == userId));
        }

        public IQueryable<Chat> GetCommonChats(Guid participantId1, Guid participantId2)
        {
            return base.Get(c =>
                c.Participants.Any(p => p.PersonId == participantId1) &&
                c.Participants.Any(p => p.PersonId == participantId2));
        }

        public async Task<int> AddParticipants(Guid chatId, Guid[] participantIds, CancellationToken cancellationToken = default)
        {
            var chat = await db
                .Chats
                .Include(c => c.Participants)
                .SingleOrDefaultAsync(i => i.Id == chatId, cancellationToken);

            var existingParticipantsIds = chat?.Participants.Select(p => p.PersonId).ToArray() ?? [];

            var newPersonIdsToAdd = participantIds.Except(existingParticipantsIds).ToArray();

            if (!newPersonIdsToAdd.Any())
                return 0;

            //StringBuilder sb = new StringBuilder();
            //sb.AppendLine("....");
            //sb.AppendLine($"chatId {chatId}");
            //sb.AppendLine($"personId {string.Join(", ",
            //    newPersonIdsToAdd
            //        .Select(personId => personId.ToString()))}");

            IEnumerable<ChatParticipant> newParticipants = newPersonIdsToAdd
                .Select(personId => new ChatParticipant() { ChatId = chatId, PersonId = personId });

            await db.ChatParticipants.AddRangeAsync(newParticipants, cancellationToken);

            //try
            //{
                return await db.SaveChangesAsync(cancellationToken);
            //}
            //catch (Exception ex)
            //{
            //    string message = sb.ToString();
            //    Console.WriteLine(message);
            //    throw new Exception(message, ex);
            //}
        }

        public async Task<int> RemoveParticipants(Guid chatId, Guid[] participantIds, CancellationToken cancellationToken = default)
        {
            return await db
                .ChatParticipants
                .Where(cp => participantIds.Contains(cp.PersonId))
                .ExecuteDeleteAsync(cancellationToken);
        }
    }
}