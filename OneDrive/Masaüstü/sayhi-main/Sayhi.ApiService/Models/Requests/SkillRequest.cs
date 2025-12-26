using Microsoft.EntityFrameworkCore.Query;
using Sayhi.Model;

namespace Sayhi.ApiService.Models.Requests
{
    public record SkillRequest(
        //Guid Id,
        string? Name,
        string? Description,
        bool? IsActive) : IRequest<Guid, Skill>
    {
        //public Expression<Func<SetPropertyCalls<Skill>, SetPropertyCalls<Skill>>> UpdateFields()
        public Action<UpdateSettersBuilder<Skill>> UpdateFields()
        {
            return setters => setters
                //.SetProperty(d => d.Id, Id)
                .SetProperty(d => d.Name, Name);
        }

        public Skill UpdateFields(Skill current)
        {
            current.Name = Name ?? current.Name;
            return current;
        }
    }
}