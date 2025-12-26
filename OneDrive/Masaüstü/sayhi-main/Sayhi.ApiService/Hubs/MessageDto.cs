using Sayhi.Model;

namespace Sayhi.ApiService.Hubs
{
    //public record MessageDto(Guid ChatId, Guid SenderId, /*Guid? ToId,*/ string Text, DateTimeOffset? CreatedAt = null)
    public record MessageDto
    {
        public Guid Id { get; init; } = Guid.CreateVersion7();
        public Guid ChatId { get; init; }
        public Guid SenderId { get; init; }
        public string Text { get; init; }
        public DateTimeOffset CreatedAt { get; init; }

        public MessageDto(Guid chatId, Guid senderId, string text, DateTimeOffset? createdAt = null)
        {
            ChatId = chatId;
            SenderId = senderId;
            Text = text;
            CreatedAt = createdAt ?? DateTimeOffset.UtcNow;
        }

        public MessageDto(Guid id, Guid chatId, Guid senderId, string text, DateTimeOffset createdAt)
        {
            ChatId = chatId;
            SenderId = senderId;
            Text = text;
            CreatedAt = createdAt;
        }

        public static MessageDto Create(ChatMessage value)
        {
            return new MessageDto(value.Id, value.ChatId, value.SenderId, value.Text, value.CreatedAt);
        }
    }
}