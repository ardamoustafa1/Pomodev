namespace Sayhi.Model
{
    public class AgentSkill : BaseEntityWithCreated
    {
        public Guid AgentId { get; set; }
        public Agent Agent { get; set; } = null!;

        public Guid SkillId { get; set; }
        public Skill Skill { get; set; } = null!;

        public ProficiencyLevel Proficiency { get; set; }
        public DateTime? CertifiedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public bool IsPrimary { get; set; }
    }
}
