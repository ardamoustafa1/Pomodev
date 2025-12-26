using Concordia;
using Sayhi.ApiService.Hubs;

namespace Sayhi.ApiService.Features.Chat.Events
{
    public class CustomerConnectedEvent : INotification
    {
        public HubUser User { get; set; } = default!;
        //public Person? Person { get; set; }
    }
}
