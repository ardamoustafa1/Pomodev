using Microsoft.AspNetCore.SignalR;

namespace Sayhi.ApiService.Hubs
{
    public partial class ChatHub(
        IChatService chatService,
        ILogger<ChatHub> logger) : Hub<IChatHubClient>, IChatHubService
    {
        public override async Task OnConnectedAsync()
        {
            HubCaller caller = GetCurrentConnection();

            //await chatService.UserConnected(Context.ConnectionId, username, isAgent);
            await chatService.UserConnected(caller);

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            HubCaller caller = GetCurrentConnection();

            await chatService.UserDisconnected(caller);

            await base.OnConnectedAsync();
        }

        ////public async Task SendMessage(string user, string message)
        //public async Task<string> SendMessage(MessageDto chatMessageDto)
        public async Task SendMessage(Guid chatId, string text)
        {
            HubCaller caller = GetCurrentConnection();

            try
            {
                await chatService.SendMessage(caller, chatId, text);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in ChatHub: SendMessage");
                throw new InvalidOperationException("Internal server error");
            }
        }

        public async Task SendTyping(Guid chatId, bool isTyping)
        {
            HubCaller caller = GetCurrentConnection();

            try
            {
                await chatService.SendTyping(caller, chatId, isTyping);
            }
            catch (Exception ex)
            {
                logger.LogError($"Error in ChatHub: SendTyping: {ex}");
                throw;
            }
        }

        public async Task Ring(Guid chatId, Guid calleeId)
        {
            HubCaller caller = GetCurrentConnection();

            await chatService.Ring(caller, chatId, calleeId);
        }

        public async Task Hangup(Guid chatId, Guid calleeId)
        {
            HubCaller caller = GetCurrentConnection();

            await chatService.Hangup(caller, chatId, calleeId);
        }

        public async Task Join(Guid chatId)
        {
            HubCaller caller = GetCurrentConnection();

            await chatService.Join(caller, chatId);
        }

        public async Task Leave(Guid chatId)
        {
            HubCaller caller = GetCurrentConnection();

            await chatService.Leave(caller, chatId);
        }

        public async Task AddAIToChat(Guid chatId)
        {
            HubCaller caller = GetCurrentConnection();

            await chatService.AddAIToChat(caller, chatId);
        }

        public async Task AddAgentToChat(Guid chatId)
        {
            HubCaller caller = GetCurrentConnection();

            await chatService.AddAgentToChat(caller, chatId);
        }

        public async Task RemoveAIFromChat(Guid chatId)
        {
            HubCaller caller = GetCurrentConnection();

            await chatService.RemoveAIFromChat(caller, chatId);
        }

        public async Task RemoveAgentFromChat(Guid chatId)
        {
            HubCaller caller = GetCurrentConnection();

            await chatService.RemoveAgentFromChat(caller, chatId);
        }

        /*
        private (bool, string) GetCurrentConnection()
        {
            var request = Context.GetHttpContext()?.Request;
            string? username = request?.Query["username"].ToString();
            string? agentname = request?.Query["agentname"].ToString();

            bool isAgent = !string.IsNullOrEmpty(agentname);

            return (isAgent, (isAgent ? agentname : username) ?? "");
            //return Context.User?.Identity?.Name
            //     ?? Context.GetHttpContext()?.Request.Query["username"].ToString()
            //     //?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            //     ?? Context.ConnectionId;
        }
        */

        private HubCaller GetCurrentConnection()
        {
            var request = Context.GetHttpContext()?.Request;
            string? username = request?.Query["username"].ToString();
            string? agentname = request?.Query["agentname"].ToString();

            bool isAgent = !string.IsNullOrEmpty(agentname);

            return new HubCaller(
                Context.ConnectionId,
                (isAgent ? agentname : username) ?? "",
                isAgent ? HubUserType.Agent : HubUserType.Customer);
        }
    }
}