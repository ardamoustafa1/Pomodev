//using Concordia;

//namespace Sayhi.ApiService.Features.Chat.Commands
//{
//    public class CustomerConnectedCommandHandler(IMediator mediator) : IRequestHandler<CustomerConnectedCommand>
//    {
//        public async Task Handle(CustomerConnectedCommand request, CancellationToken cancellationToken)
//        {
//            Console.WriteLine($"CustomerConnected person: {request.Person} with ID: {request.User.Id}");

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