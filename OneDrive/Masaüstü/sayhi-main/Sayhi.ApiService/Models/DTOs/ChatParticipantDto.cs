using Sayhi.Model;

namespace Sayhi.ApiService.Models.DTOs
{
    public class ChatParticipantDto : IDto<Guid>
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = "";
        public string Email { get; set; } = "";
        public string Avatar { get; set; } = "";

        public IEntity ConvertTo()
        {
            return new ChatParticipant()
            {
                ChatId = Guid.Empty,
                PersonId = Id,
                //CreatedAt = CreatedAt
            };
        }
    }
}
