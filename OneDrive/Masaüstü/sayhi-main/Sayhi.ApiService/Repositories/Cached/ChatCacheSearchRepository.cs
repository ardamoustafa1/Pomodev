using System.Collections.Concurrent;
using Microsoft.Extensions.Caching.Memory;
using Sayhi.Model;

namespace Sayhi.ApiService.Repositories.Cached
{
    public class ChatCacheSearchRepository(IMemoryCache memoryCache)
    {
        private readonly TimeSpan ChatTTL = TimeSpan.FromHours(2);

        private static readonly ConcurrentDictionary<Guid, HashSet<Guid>> userChatsIndex = new();
        private static readonly HashSet<Guid> activeChatsIndex = new();

        public void CacheChat(Chat chat)
        {
            memoryCache.Set(chat.Id, chat, ChatTTL);

            foreach (Guid participantId in chat.Participants.Select(p => p.PersonId))
            {
                if (!userChatsIndex.ContainsKey(participantId))
                {
                    userChatsIndex[participantId] = new HashSet<Guid>();
                }

                userChatsIndex[participantId].Add(chat.Id);
            }

            activeChatsIndex.Add(chat.Id);
        }

        public List<Chat> GetUserChats(Guid participantId)
        {
            if (!userChatsIndex.TryGetValue(participantId, out var chatIds))
                return [];

            return GetChatsByKeys(chatIds);
        }

        public List<Chat> GetActiveChats()
        {
            return GetChatsByKeys(activeChatsIndex);
        }

        private List<Chat> GetChatsByKeys(HashSet<Guid> chatIds)
        {
            List<Chat> chats = [];

            foreach (Guid chatId in chatIds)
            {
                if (memoryCache.TryGetValue(chatId, out Chat? chat) && chat != null)
                {
                    chats.Add(chat);
                }
            }

            return chats;
        }
    }
}