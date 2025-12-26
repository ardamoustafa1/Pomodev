namespace Sayhi.Model
{
    public class ChatMessage : BaseEntity
    {
        public Guid ChatId { get; set; }
        public Chat Chat { get; set; } = null!;
        public Guid SenderId { get; set; }
        public Person Sender{ get; set; } = null!;
        public string Text { get; set; } = "";
        public MessageStatusType Status { get; set; }

        public static ChatMessage Create(Guid chatId, Guid senderId, string text)
        {
            return new ChatMessage
            {
                ChatId = chatId,
                SenderId = senderId,
                Text = text,
                Status = MessageStatusType.Sent
            };
        }
    }
}
