using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sayhi.Model
{
    public class Agent : BaseEntity
    {
        //AgentGroups.GroupId = , Status = , IncludeSkills = False
        public Person Person { get; set; } = null!;

        [MaxLength(20)]
        public string? EmployeeId { get; set; }
        public AgentStatus Status { get; set; }
        public DateTimeOffset? LastActivityAt { get; set; }

        //public Guid? GroupId { get; set; }
        //public Group? Group { get; set; }
        public ICollection<AgentGroup> AgentGroups { get; set; } = [];
        public ICollection<AgentSkill> AgentSkills { get; set; } = [];
        public ICollection<QueueAssignment> QueueAssignments { get; set; } = [];

        [NotMapped]
        public string Email => Person?.Email ?? "";
        [NotMapped]
        public string? PhoneNumber => Person?.PhoneNumber;
        [NotMapped]
        public string? AvatarUrl => Person?.AvatarUrl;

        [NotMapped]
        //public string FullName => $"{FirstName} {LastName}";
        public string Name => Person?.Name ?? "";
        [NotMapped]
        public bool IsAvailable => Status == AgentStatus.Available;
        [NotMapped]
        public bool IsActive => Status != AgentStatus.Away;
    }
}
