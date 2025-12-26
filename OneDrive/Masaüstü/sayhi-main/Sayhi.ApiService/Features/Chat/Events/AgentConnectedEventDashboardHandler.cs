using Concordia;

namespace Sayhi.ApiService.Features.Chat.Events
{
    public class AgentConnectedEventDashboardHandler(IDashboardCache dashboardCache) : INotificationHandler<AgentConnectedEvent>
    {
        public Task Handle(AgentConnectedEvent notification, CancellationToken cancellationToken)
        {
            dashboardCache.AgentConnected(notification.User.Id);
            Console.WriteLine($"[Dashboard] AgentConnectedEvent: {notification.User.Id} / {dashboardCache.GetActiveAgentCount()}/{dashboardCache.GetActiveCustomerCount()}");
            return Task.CompletedTask;
        }
    }
}