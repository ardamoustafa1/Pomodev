using Sayhi.Model;

namespace Sayhi.ApiService.Models.DTOs
{
    public class AgentDto : IDto<Guid>
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = "";
        public string Email { get; set; } = "";
        public string? PhoneNumber { get; set; }
        public string? AvatarUrl { get; set; }

        public string? EmployeeId { get; set; }
        public AgentStatus Status { get; set; }
        public DateTimeOffset? LastActivityAt { get; set; }

        public bool IsAvailable { get; set; }
        public bool IsActive { get; set; }
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        //public IEntity ConvertTo()
        //{
        //    return new Agent()
        //    {
        //        Id = Id,
        //        EmployeeId = EmployeeId,
        //        Status = Status,
        //        LastActivityAt = LastActivityAt,
        //        CreatedAt = CreatedAt
        //    };
        //}

        //public static AgentDto Create(Agent item, Guid currentUserId)
        //{
        //    return new AgentDto()
        //    {
        //        Id = item.Id,
        //        Name = item.Person.Name,
        //        Email = item.Person.Email,
        //        PhoneNumber = item.Person.PhoneNumber,
        //        AvatarUrl = item.Person.AvatarUrl,
        //        EmployeeId= item.EmployeeId,
        //        Status = item.Status,
        //        LastActivityAt = item.LastActivityAt,
        //        IsAvailable = item.IsAvailable,
        //        IsActive = item.IsActive,
        //        CreatedAt = item.CreatedAt
        //    };
        //}
    }
}