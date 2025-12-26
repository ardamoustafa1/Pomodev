using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore.Query;
using Sayhi.Model;

namespace Sayhi.ApiService.Models.Requests
{
    public record AssignAgentToQueueRequest(
        Guid AgentId,
        Guid QueueId,
        int Priority = 1) : IRequest<Guid, Agent>
    {
        //public Expression<Func<SetPropertyCalls<Agent>, SetPropertyCalls<Agent>>> UpdateFields()
        public Action<UpdateSettersBuilder<Agent>> UpdateFields()
        {
            return setters => setters
                //.SetProperty(a => a.Id, Id)
                //.SetProperty(a => a.Name, Name)
                .SetProperty(a => a.IsActive, true);
        }

        public Agent UpdateFields(Agent current)
        {
            return current;
        }
    }
}