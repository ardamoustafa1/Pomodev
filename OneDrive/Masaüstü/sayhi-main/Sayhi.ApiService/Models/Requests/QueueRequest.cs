using Microsoft.EntityFrameworkCore.Query;
using Sayhi.Model;

namespace Sayhi.ApiService.Models.Requests
{
    public record QueueRequest(
        //Guid Id,
        string? Name,
        string? Description,
        bool? IsActive) : IRequest<Guid, Queue>
    {
        //public Expression<Func<SetPropertyCalls<Queue>, SetPropertyCalls<Queue>>> UpdateFields()
        public Action<UpdateSettersBuilder<Queue>> UpdateFields()
        {
            return setters => setters
                .SetProperty(d => d.Name, Name)
                .SetProperty(d => d.Description, Description)
                .SetProperty(d => d.IsActive, IsActive);
        }

        public Queue UpdateFields(Queue current)
        {
            current.Name = Name ?? current.Name;
            current.Description = Description ?? current.Description;
            current.IsActive = IsActive ?? current.IsActive;
            return current;
        }
    }
}