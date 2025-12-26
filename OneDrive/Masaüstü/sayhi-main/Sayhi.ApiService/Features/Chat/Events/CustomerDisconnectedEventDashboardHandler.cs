using Concordia;

namespace Sayhi.ApiService.Features.Chat.Events
{
    public class CustomerDisconnectedEventDashboardHandler(IDashboardCache dashboardCache) : INotificationHandler<CustomerDisconnectedEvent>
    {
        public Task Handle(CustomerDisconnectedEvent notification, CancellationToken cancellationToken)
        {
            dashboardCache.CustomerDisconnected(notification.User.Id);
            Console.WriteLine($"[Dashboard] CustomerDisconnectedEvent: {notification.User.Id} / {dashboardCache.GetActiveAgentCount()}/{dashboardCache.GetActiveCustomerCount()}");
            return Task.CompletedTask;
        }
    }
}
