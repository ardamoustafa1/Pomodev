using Sayhi.Model;

namespace Sayhi.ApiService.Models.DTOs
{
    public class SkillDto : IDto<Guid>
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = "";

        public IEntity ConvertTo()
        {
            return new Skill() { Id = Id, Name = Name };
        }
    }
}