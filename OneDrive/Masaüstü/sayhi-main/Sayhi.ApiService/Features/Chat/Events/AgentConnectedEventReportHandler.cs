using Concordia;

namespace Sayhi.ApiService.Features.Chat.Events
{
    public class AgentConnectedEventReportHandler : INotificationHandler<AgentConnectedEvent>
    {
        public Task Handle(AgentConnectedEvent notification, CancellationToken cancellationToken)
        {

            return Task.CompletedTask;
        }
    }
}
