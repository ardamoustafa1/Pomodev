namespace Sayhi.Model
{
    public class QueueAssignment : BaseEntityWithCreated
    {
        public Guid AgentId { get; set; }
        public Agent Agent { get; set; } = null!;

        public Guid QueueId { get; set; }
        public Queue Queue { get; set; } = null!;

        public DateTimeOffset? UnassignedAt { get; set; }
        public bool IsActive => UnassignedAt == null;
        public int Priority { get; set; } = 1;

        // Performance metrics
        public int CallsHandled { get; set; }
        public double AverageHandleTime { get; set; }
        public double SatisfactionScore { get; set; }
    }
}
