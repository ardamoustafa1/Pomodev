using System.ComponentModel.DataAnnotations;

namespace Sayhi.Model
{
    public class Skill : BaseEntity
    {
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = "";

        [MaxLength(200)]
        public string Description { get; set; } = "";
        public SkillCategory Category { get; set; }
        public int Priority { get; set; } = 1;
        public bool IsActive { get; set; } = true;

        // Navigation Properties
        public ICollection<AgentSkill> AgentSkills { get; set; } = new List<AgentSkill>();
        public ICollection<QueueSkill> QueueSkills { get; set; } = new List<QueueSkill>();
    }
}
