using Microsoft.EntityFrameworkCore.Query;
using Sayhi.Model;

namespace Sayhi.ApiService.Models.Requests
{
    public record SetAgentStatusRequest(Guid AgentId, AgentStatus Status) : IRequest<Guid, Agent>
    {
        //public Expression<Func<SetPropertyCalls<Agent>, SetPropertyCalls<Agent>>> UpdateFields()
        public Action<UpdateSettersBuilder<Agent>> UpdateFields()
        {
            return setters => setters
                //.SetProperty(d => d.Id, Id)
                //.SetProperty(d => d.Name, Name)
                .SetProperty(d => d.Status, Status)                ;
        }

        public Agent UpdateFields(Agent current)
        {
            current.Status = Status;
            return current;
        }
    }
}