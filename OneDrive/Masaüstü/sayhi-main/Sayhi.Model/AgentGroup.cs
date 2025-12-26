namespace Sayhi.Model
{
    public class AgentGroup : BaseEntityWithCreated
    {
        public Guid AgentId { get; set; }
        public Agent Agent { get; set; } = null!;

        public Guid GroupId { get; set; }
        public Group Group { get; set; } = null!;
    }
}
