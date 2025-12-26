using Concordia;

namespace Sayhi.ApiService.Features.Chat.Events
{
    public class CustomerConnectedEventDashboardHandler(IDashboardCache dashboardCache) : INotificationHandler<CustomerConnectedEvent>
    {
        public Task Handle(CustomerConnectedEvent notification, CancellationToken cancellationToken)
        {
            dashboardCache.CustomerConnected(notification.User.Id);
            Console.WriteLine($"[Dashboard] CustomerConnectedEvent: {notification.User.Id} / {dashboardCache.GetActiveAgentCount()}/{dashboardCache.GetActiveCustomerCount()}");
            return Task.CompletedTask;
        }
    }

    public static class AgentsDash1
    {
        private static int agentsCount = 0;
        
        public static void Inc() => agentsCount++;
        public static void Dec() => agentsCount--;
        public static int Count() => agentsCount;
    }
}
