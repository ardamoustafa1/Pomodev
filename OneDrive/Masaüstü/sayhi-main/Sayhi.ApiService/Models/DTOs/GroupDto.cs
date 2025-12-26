using Sayhi.Model;

namespace Sayhi.ApiService.Models.DTOs
{
    public class GroupDto : IDto<Guid>
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = "";
        public string? Description { get; set; }
        public GroupType Type { get; set; }
        public Agent? Manager { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}