using Sayhi.Model;

namespace Sayhi.ApiService.Models.DTOs
{
    public class QueueDto : IDto<Guid>
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = "";
        public string? Description { get; set; }
        public QueueType Type { get; set; }
        public int Priority { get; set; } = 1;
        public int MaxWaitTime { get; set; } = 300;
        public int MaxConcurrentCalls { get; set; } = 10;
        public bool IsActive { get; set; } = true;
        public Group? Group { get; set; }
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}