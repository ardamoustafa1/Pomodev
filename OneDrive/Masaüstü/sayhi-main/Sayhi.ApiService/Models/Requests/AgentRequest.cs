using Microsoft.EntityFrameworkCore.Query;
using Sayhi.Model;

namespace Sayhi.ApiService.Models.Requests
{
    public record AgentRequest(
         Guid Id,
         string? Name,
         string? Email,
         string? Password,
         string? PhoneNumber,
         string? AvatarUrl,
         string? EmployeeId,
         Guid? GroupId) : IRequest<Guid, Agent>
    {
        //public Expression<Func<SetPropertyCalls<Agent>, SetPropertyCalls<Agent>>> UpdateFields()
        public Action<UpdateSettersBuilder<Agent>> UpdateFields()
        {
            return setters => setters
                .SetProperty(d => d.Id, Id)
                .SetProperty(d => d.Name, Name)
                .SetProperty(d => d.Email, Email)
                //.SetProperty(d => d.Person.Password, Password)
                //.SetProperty(d => d.Person.PhoneNumber, PhoneNumber)
                //.SetProperty(d => d.Person.AvatarUrl, AvatarUrl)
                .SetProperty(d => d.EmployeeId, EmployeeId);
        }

        public Agent UpdateFields(Agent current)
        {
            current.Id = Id;
            //current.Name = Name;
            //current.Email = Email;
            current.EmployeeId = EmployeeId;
            return current;
        }
    }
}