//using Concordia;

//namespace Sayhi.ApiService.Features.Chat.Commands
//{
//    public class CustomerDisconnectedCommandHandler(IMediator mediator) : IRequestHandler<CustomerDisconnectedCommand>
//    {
//        public async Task Handle(CustomerDisconnectedCommand request, CancellationToken cancellationToken)
//        {
//            Console.WriteLine($"CustomerDisconnected person: {request.Person} with ID: {request.User.Id}");

//            //await mediator.Publish(new AgentConnectedEvent()
//            //{
//            //    User = request.User,
//            //    Person = request.Person
//            //    //EklenmeTarihi = DateTime.Now
//            //}, cancellationToken);

//            //return Task.CompletedTask;
//        }
//    }
//}