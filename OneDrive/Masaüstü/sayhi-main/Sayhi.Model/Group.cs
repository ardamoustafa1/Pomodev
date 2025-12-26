using System.ComponentModel.DataAnnotations;

namespace Sayhi.Model
{
    public class Group : BaseEntity
    {
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = "";

        [MaxLength(200)]
        public string? Description { get; set; }
        public GroupType Type { get; set; }
        public Guid? ManagerId { get; set; }
        public Agent? Manager { get; set; }
        public bool IsActive { get; set; } = true;

        //public ICollection<Agent> Agents { get; set; } = [];
        public ICollection<AgentGroup> AgentGroups { get; set; } = [];
        public ICollection<Queue> Queues { get; set; } = [];

        //public int AgentCount => AgentGroups.Count(a => a.IsActive);
        //public int AvailableAgentCount => AgentGroups.Count(a => a.IsAvailable);
    }
}
