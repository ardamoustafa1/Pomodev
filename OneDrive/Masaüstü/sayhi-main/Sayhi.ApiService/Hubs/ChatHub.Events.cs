//using Microsoft.AspNetCore.SignalR;
//using Sayhi.Model;

//namespace Sayhi.ApiService.Hubs
//{
//    public partial class ChatHub
//    {
//        private async Task NotifyAgentConnected(string connectionId, Person? person)
//        {
//            if (person != null)
//            {
//                await Groups.AddToGroupAsync(connectionId, "Agents");//$"Agents-{ApiKey}");
//                await Clients.Caller.ActiveUsers(customerConnections.GetAll());
//                await Clients.Caller.ActiveAgents(agentConnections.GetAll());
//            }
//        }

//        private async Task NotifyUserConnected(HubUser user)
//        {
//            //userConnections.AddOrUpdate(connectionId, new HubUser(person.Name, person.Id));

//            await Groups.AddToGroupAsync(user.ConnectionId, "Users");// $"Users-{ApiKey}");

//            await Clients.Group("Agents").UserLoggedIn(user);
//            //await Clients.Group("Agents").SendAsync("NewClientConnected", new
//            //{
//            //    ConnectionId = connectionId,
//            //    Username = username,
//            //    UserId = person.Id,
//            //    CreatedAt = DateTimeOffset.UtcNow
//            //});
//        }

//        public async Task NotifyDisconnected(HubUser user)
//        {
//            if (user.Id != Guid.Empty)
//            {
//                await Clients.Group("Agents").UserLoggedOut(user);
//                //await Clients.Group("Agents").SendAsync("ClientDisconnected", new
//                //{
//                //    ConnectionId = connectionId,
//                //    Username = username,
//                //    UserId = userId,
//                //    CreatedAt = DateTimeOffset.UtcNow
//                //});
//            }
//        }

//        public async Task NotifyReceiveMessage(MessageDto chatMessageDto, string[] recipients)
//        {
//            /*
                
//                * 1) ToId yerine ChatId kullan
//                * 2) Grupları ChatId ile oluştur
//                    public override async Task OnConnectedAsync()
//                    {
//                        var chatId = Context.GetHttpContext()?.Request.Query["chatId"];
//                        if (!string.IsNullOrEmpty(chatId))
//                            await Groups.AddToGroupAsync(connectionId, chatId);
//                    }

//            await Clients.Group(chatId).SendAsync("ReceiveMessage", user, message);

//            var aiReply = await aiApiClient.Ask(chatId, message);

//            await Clients.Group(chatId).SendAsync("ReceiveMessage", "AI", aiReply);

//            */

//            if (recipients.Length == 0)
//                return;

//            foreach (string recipient in recipients)
//            {
//                await Clients.Client(recipient).ReceiveMessage(chatMessageDto);
//            }
//        }

//        public async Task NotifyTyping(Guid chatId, Guid senderId, bool isTyping, string[] recipients)
//        {
//            //    (bool isAgent, string username) = GetCurrentConnection();
//            //    ConnectionMapping connections = isAgent ? agentsConnections : userConnections;

//            //    HubUser? senderHubUser = connections.GetUser(connectionId);

//            //    if (senderHubUser?.UserId != senderId)
//            //        return;

//            //    string[] recipients = await GetRecipientConnectionIds(connections, /*toId,*/ chatId);

//            if (recipients.Length == 0)
//                return;

//            foreach (string recipient in recipients)
//            {
//                //await Clients.Client(recipient).Typing(new { SenderId = senderId, IsTyping = isTyping });
//                await Clients.Client(recipient).Typing(chatId, senderId, isTyping);
//            }
//        }

//        private async Task NotifyInvite(Guid chatId, HubUser? sender, HubUser? recipient)
//        {
//            if (recipient == null)
//                return;

//            await Clients.Client(recipient.ConnectionId).ReceiveInvite(chatId, sender);
//        }

//        private async Task NotifyJoin(Guid chatId, HubUser user)
//        {
//            string groupName = chatId.ToString();

//            if (!user.IsAI)
//            {
//                await Groups.AddToGroupAsync(user.ConnectionId, groupName);
//            }

//            await Clients.Groups(groupName).UserJoined(chatId, user);
//        }

//        //private async Task NotifyChatInfo(Guid chatId)
//        //{
//        //    string groupName = chatId.ToString();

//        //    await Clients.Groups(groupName).ChatInfo(chatId, users);
//        //}

//        private async Task NotifyLeft(Guid chatId, HubUser user)
//        {
//            string groupName = chatId.ToString();
//            await Groups.RemoveFromGroupAsync(user.ConnectionId, groupName);

//            await Clients.Groups(groupName).UserLeft(chatId, user);
//        }
//    }
//}
