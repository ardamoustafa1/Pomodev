using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using Sayhi.Model;

namespace Sayhi.ApiService.Repositories.Cached
{
    public class ChatCachedRepository(
        IChatRepository repository,
        ILogger<ChatCachedRepository> logger)
    {
        private static readonly ConcurrentDictionary<Guid, Chat> cache = new();

        public async Task<Chat?> GetById(Guid chatId, CancellationToken cancellationToken = default)
        {
            if (cache.TryGetValue(chatId, out Chat? chat))
            {
                return chat;
            }

            chat = await repository.GetById(chatId, cancellationToken);

            if (chat != null)
            {
                cache.TryAdd(chat.Id, chat);
            }

            return chat;
        }

        public async Task<Chat?> GetLastChatByUser(Guid userId, CancellationToken cancellationToken = default)
        {
            Chat? chat = cache
                .Values
                .Where(c => c.Participants.Any(p => p.PersonId == userId))
                .OrderByDescending(c => c.CreatedAt)
                .FirstOrDefault();

            if (chat != null)
                return chat;

            chat = await repository.GetByUser(userId)
                .OrderByDescending(c => c.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (chat != null)
            {
                cache.TryAdd(chat.Id, chat);
            }

            return chat;
        }

        public async Task<Chat> Add(Chat item, CancellationToken cancellationToken = default)
        {
            Chat chat = await repository.Add(new Chat(), cancellationToken);

            cache.TryAdd(chat.Id, chat);

            return chat;
        }

        public async Task<int> AddParticipants(Guid chatId, Guid[] participantIds, CancellationToken cancellationToken = default)
        {
            if (!cache.TryGetValue(chatId, out Chat? chat))
            {
                chat = await repository.GetById(chatId, cancellationToken);
            }

            if (chat != null)
            {
                foreach (Guid participantId in participantIds)
                {
                    chat.Participants.Add(
                        new ChatParticipant()
                        {
                            ChatId = chatId,
                            PersonId = participantId
                        });
                }

                cache.AddOrUpdate(chat.Id, chat, (k, v) => chat);
            }

            return await repository.AddParticipants(chatId, participantIds, cancellationToken);
        }

        public async Task<int> RemoveParticipants(Guid chatId, Guid[] participantIds, CancellationToken cancellationToken = default)
        {
            if (!cache.TryGetValue(chatId, out Chat? chat))
            {
                chat = await repository.GetById(chatId, cancellationToken);
            }

            if (chat != null)
            {
                foreach (Guid participantId in participantIds)
                {
                    ChatParticipant? participant = chat.Participants.SingleOrDefault(p => p.PersonId == participantId);
                    if (participant != null)
                    {
                        chat.Participants.Remove(participant);
                    }
                }

                cache.AddOrUpdate(chat.Id, chat, (k, v) => chat);
            }

            return await repository.RemoveParticipants(chatId, participantIds, cancellationToken);
        }
    }
}