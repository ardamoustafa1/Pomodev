using Concordia;
using Sayhi.ApiService.Hubs;
using Sayhi.Model;

namespace Sayhi.ApiService.Features.Chat.Events
{
    public class AgentDisconnectedEvent : INotification
    {
        public HubUser User { get; set; } = default!;
        //public Person? Person { get; set; }
    }
}
