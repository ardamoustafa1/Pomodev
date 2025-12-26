//using Concordia;
//using Sayhi.ApiService.Features.Chat.Events;

//namespace Sayhi.ApiService.Features.Chat.Commands
//{
//    public class AgentDisconnectedCommandHandler(IDashboardCache dashboardCache, IMediator mediator) : IRequestHandler<AgentDisconnectedCommand>
//    {
//        public async Task Handle(AgentDisconnectedCommand request, CancellationToken cancellationToken)
//        {
//            AgentsDash.Dec();

//            dashboardCache.Remove(request.User);

//            Console.WriteLine($"AgentDisconnected person: {request.Person} with ID: {request.User.Id} / {AgentsDash.Count()} :: {dashboardCache.Count()}");
//        }
//    }
//}