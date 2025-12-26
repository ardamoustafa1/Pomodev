//using Concordia;
//using Sayhi.ApiService.Features.Chat.Events;

//namespace Sayhi.ApiService.Features.Chat.Commands
//{
//    public class AgentConnectedCommandHandler(IMediator mediator) : IRequestHandler<AgentConnectedCommand>
//    {
//        public async Task Handle(AgentConnectedCommand request, CancellationToken cancellationToken)
//        {
//            Console.WriteLine($"AgentConnected person: {request.Person} with ID: {request.User.Id}");

//            await mediator.Publish(new AgentConnectedEvent()
//            {
//                User = request.User,
//                Person = request.Person
//            }, cancellationToken);
//        }
//    }
//}
