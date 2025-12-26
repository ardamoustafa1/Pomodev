using System.ComponentModel.DataAnnotations;

namespace Sayhi.ApiService.Models
{
    public class PublicChatMessageRequest
    {
        public int Id { get; set; }
        [Required]
        public string SiteKey { get; set; } = "";
        [Required]
        [StringLength(1000, MinimumLength = 1)]
        public string Message { get; set; } = "";
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public string IpAddress { get; set; } = "";
    }
}