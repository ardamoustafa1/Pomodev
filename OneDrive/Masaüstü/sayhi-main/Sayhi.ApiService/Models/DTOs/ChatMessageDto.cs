using System.Text.Json.Serialization;
using Sayhi.Model;

namespace Sayhi.ApiService.Models.DTOs
{
    public class ChatMessageDto : IDto<Guid>
    {
        public Guid Id { get; set; }
        public Guid SenderId { get; set; }
        public string Text { get; set; } = "";
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public bool IsOwn { get; set; }
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public MessageStatusType Status { get; set; }

        public IEntity ConvertTo()
        {
            return new ChatMessage()
            {
                Id = Id,
                SenderId = SenderId,
                Text = Text,
                CreatedAt = CreatedAt,
                Status = Status
            };
        }

        public static ChatMessageDto Create(ChatMessage m, Guid currentUserId)
        {
            return new ChatMessageDto()
            {
                Id = m.Id,
                //Sender = m.Sender?.Name ?? (m.SenderId == currentUserId ? "ben" : "sen"),
                SenderId = m.SenderId,
                Text = m.Text,
                CreatedAt = m.CreatedAt,
                IsOwn = m.SenderId == currentUserId,
                Status = m.Status
            };
        }
    }
}