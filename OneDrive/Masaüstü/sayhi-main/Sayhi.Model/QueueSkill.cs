namespace Sayhi.Model
{
    public class QueueSkill : BaseEntityWithCreated
    {
        public Guid QueueId { get; set; }
        public Queue Queue { get; set; } = null!;

        public Guid SkillId { get; set; }
        public Skill Skill { get; set; } = null!;

        public bool IsRequired { get; set; }
        public ProficiencyLevel MinimumProficiency { get; set; }
        public int Weight { get; set; } = 1;
    }
}
