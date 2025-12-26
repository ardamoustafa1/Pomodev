using Microsoft.EntityFrameworkCore.Query;
using Sayhi.Model;

namespace Sayhi.ApiService.Models.Requests
{
    public record GroupRequest(
        //Guid Id,
        string? Name,
        string? Description,
        GroupType? Type,
        Agent? Manager,
        bool? IsActive) : IRequest<Guid, Group>
    {
        //public Expression<Func<SetPropertyCalls<Group>, SetPropertyCalls<Group>>> UpdateFields()
        public Action<UpdateSettersBuilder<Group>> UpdateFields()
        {
            return setters => setters
                .SetProperty(d => d.Name, Name)
                .SetProperty(d => d.Description, Description)
                .SetProperty(d => d.Type, Type)
                .SetProperty(d => d.ManagerId, (d) => Manager != null ? Manager.Id : d.ManagerId)
                .SetProperty(d => d.IsActive, IsActive);
        }

        public Group UpdateFields(Group current)
        {
            current.Name = Name ?? current.Name;
            current.Description = Description ?? current.Description;
            current.Type = Type ?? current.Type;
            current.Manager = Manager ?? current.Manager;
            current.IsActive = IsActive ?? current.IsActive;
            return current;
        }
    }
}