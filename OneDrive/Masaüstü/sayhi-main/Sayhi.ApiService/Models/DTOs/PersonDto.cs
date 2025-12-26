using Sayhi.Model;

namespace Sayhi.ApiService.Models.DTOs
{
    public class PersonDto : IDto<Guid>
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = "";

        public IEntity ConvertTo()
        {
            return new Person() { Id = Id, Name = Name };
        }
    }
}