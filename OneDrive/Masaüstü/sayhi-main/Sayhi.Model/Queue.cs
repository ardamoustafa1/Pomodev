using System.ComponentModel.DataAnnotations;

namespace Sayhi.Model
{
    public class Queue : BaseEntity
    {
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = "";

        [MaxLength(200)]
        public string? Description { get; set; }
        public QueueType Type { get; set; }
        public int Priority { get; set; } = 1;
        public int MaxWaitTime { get; set; } = 300; // seconds
        public int MaxConcurrentCalls { get; set; } = 10;
        public bool IsActive { get; set; } = true;

        // Foreign Keys
        public Guid? GroupId { get; set; }
        public Group? Group { get; set; }

        // Navigation Properties
        public ICollection<QueueAssignment> QueueAssignments { get; set; } = new List<QueueAssignment>();
        public ICollection<QueueSkill> QueueSkills { get; set; } = new List<QueueSkill>();

        // Computed Properties
        public int CurrentWaitTime => CalculateCurrentWaitTime();
        public int CallCount => QueueAssignments.Count(qa => qa.IsActive);

        private int CalculateCurrentWaitTime()
        {
            // Burada kuyruk algoritmasına göre bekleme süresi hesaplanır
            return CallCount * 30; // Basit örnek
        }
    }
}
