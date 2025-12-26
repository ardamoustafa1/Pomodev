using System.ComponentModel.DataAnnotations;

namespace Sayhi.Model
{
    public class ChatParticipant : BaseEntityWithCreated
    {
        [Required]
        public Guid ChatId { get; set; }
        public Chat Chat { get; set; } = null!;

        [Required]
        public Guid PersonId { get; set; }
        public Person Person { get; set; } = null!;

        //public string? Role { get; set; }
    }
}
