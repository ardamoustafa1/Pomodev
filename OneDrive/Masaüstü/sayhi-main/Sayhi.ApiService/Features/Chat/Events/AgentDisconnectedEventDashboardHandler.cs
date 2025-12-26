using Concordia;

namespace Sayhi.ApiService.Features.Chat.Events
{
    public class AgentDisconnectedEventDashboardHandler(IDashboardCache dashboardCache) : INotificationHandler<AgentDisconnectedEvent>
    {
        public Task Handle(AgentDisconnectedEvent notification, CancellationToken cancellationToken)
        {
            dashboardCache.AgentDisconnected(notification.User.Id);
            Console.WriteLine($"[Dashboard] AgentDisconnectedEvent: {notification.User.Id} / :: {dashboardCache.GetActiveAgentCount()}/{dashboardCache.GetActiveCustomerCount()}");
            return Task.CompletedTask;
        }
    }
}
