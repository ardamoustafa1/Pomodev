using System.ComponentModel.DataAnnotations;

namespace Sayhi.Model
{
    public class Person : BaseEntity
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = "";

        //[Required]
        //[MaxLength(50)]
        //public string FirstName { get; set; } = "";

        //[Required]
        //[MaxLength(50)]
        //public string LastName { get; set; } = "";

        //[Required]
        [MaxLength(100)]
        public string? Email { get; set; }
        [Required]
        public string Password { get; set; } = "";
        public string? PhoneNumber { get; set; } = "";
        public string? AvatarUrl { get; set; } = "";
        //public ICollection<Chat> Chats { get; set; } = new List<Chat>();
        public ICollection<ChatParticipant> Chats { get; set; } = [];
        public Agent? Agent { get; set; }
    }
}
