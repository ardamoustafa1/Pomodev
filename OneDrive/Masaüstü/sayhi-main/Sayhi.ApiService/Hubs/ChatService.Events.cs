using Microsoft.AspNetCore.SignalR;

namespace Sayhi.ApiService.Hubs
{
    public partial class ChatService
    {
        //private async Task NotifyAgentConnected(string connectionId, Person? person)
        private async Task NotifyAgentConnected(HubUser user)
        {
            //if (person != null)
            //{
                await hubContext.Groups.AddToGroupAsync(user.ConnectionId, "Agents");//$"Agents-{ApiKey}");

                //var caller = ((IHubCallerClients<IChatHubClient>)hubContext.Clients).Caller;
                var caller = hubContext.Clients.Client(user.ConnectionId);

                await caller.ActiveUsers(customerConnections.GetAll());
                await caller.ActiveAgents(agentConnections.GetAll());

                await caller.UserLoggedIn(user);
            //}
        }

        private async Task NotifyUserConnected(HubUser user)
        {
            //userConnections.AddOrUpdate(connectionId, new HubUser(person.Name, person.Id));

            await hubContext.Groups.AddToGroupAsync(user.ConnectionId, "Users");// $"Users-{ApiKey}");

            await hubContext.Clients.Group("Agents").UserLoggedIn(user);
            //await Clients.Group("Agents").SendAsync("NewClientConnected", new
            //{
            //    ConnectionId = connectionId,
            //    Username = username,
            //    UserId = person.Id,
            //    CreatedAt = DateTimeOffset.UtcNow
            //});

            var caller = hubContext.Clients.Client(user.ConnectionId);

            await caller.UserLoggedIn(user);
        }

        public async Task NotifyDisconnected(HubUser? user)
        {
            if (user != null && user.Id != Guid.Empty)
            {
                await hubContext.Clients.Group("Agents").UserLoggedOut(user);
                //await Clients.Group("Agents").SendAsync("ClientDisconnected", new
                //{
                //    ConnectionId = connectionId,
                //    Username = username,
                //    UserId = userId,
                //    CreatedAt = DateTimeOffset.UtcNow
                //});
            }
        }

        public async Task NotifyReceiveMessage(MessageDto chatMessageDto
            //, string[] recipients
            )
        {
            //if (recipients.Length == 0)
            //    return;
            //
            //foreach (string recipient in recipients)
            //{
            //    await hubContext.Clients.Client(recipient).ReceiveMessage(chatMessageDto);
            //}

            string groupName = chatMessageDto.ChatId.ToString();
            await hubContext.Clients.Groups(groupName).ReceiveMessage(chatMessageDto);
        }

        public async Task NotifyReceiveSuggestion(Guid chatId, Guid messageId, string[] suggestions)
        {
            string groupName = chatId.ToString();
            await hubContext.Clients.Groups(groupName).ReceiveSuggestion(messageId, suggestions);
        }

        public async Task NotifyTyping(Guid chatId, Guid senderId, bool isTyping, string[] recipients)
        {
            ////    (bool isAgent, string username) = GetCurrentConnection();
            ////    ConnectionMapping connections = isAgent ? agentsConnections : userConnections;

            ////    HubUser? senderHubUser = connections.GetUser(connectionId);

            ////    if (senderHubUser?.UserId != senderId)
            ////        return;

            ////    string[] recipients = await GetRecipientConnectionIds(connections, /*toId,*/ chatId);

            //if (recipients.Length == 0)
            //    return;

            //foreach (string recipient in recipients)
            //{
            //    //await hubContext.Clients.Client(recipient).Typing(new { SenderId = senderId, IsTyping = isTyping });
            //    await hubContext.Clients.Client(recipient).Typing(chatId, senderId, isTyping);
            //}

            string groupName = chatId.ToString();
            await hubContext.Clients.Groups(groupName).Typing(chatId, senderId, isTyping);
        }

        private async Task NotifyRinging(Guid chatId, HubUser recipient, HubUser? caller)
        {
            await hubContext.Clients.Client(recipient.ConnectionId).ReceiveRinging(chatId, caller);
        }

        private async Task NotifyHangup(Guid chatId, HubUser recipient, HubUser? caller)
        {
            await hubContext.Clients.Client(recipient.ConnectionId).ReceiveHangup(chatId, caller);
        }

        private async Task NotifyJoin(Guid chatId, HubUser user)
        {
            string groupName = chatId.ToString();

            if (user.Type != HubUserType.AI)
            {
                await hubContext.Groups.AddToGroupAsync(user.ConnectionId, groupName);
            }

            await hubContext.Clients.Groups(groupName).UserJoined(chatId, user);
        }

        //private async Task NotifyChatInfo(Guid chatId)
        //{
        //    string groupName = chatId.ToString();

        //    await Clients.Groups(groupName).ChatInfo(chatId, users);
        //}

        private async Task NotifyLeft(Guid chatId, HubUser user)
        {
            string groupName = chatId.ToString();
            await hubContext.Groups.RemoveFromGroupAsync(user.ConnectionId, groupName);

            await hubContext.Clients.Groups(groupName).UserLeft(chatId, user);
        }
    }
}