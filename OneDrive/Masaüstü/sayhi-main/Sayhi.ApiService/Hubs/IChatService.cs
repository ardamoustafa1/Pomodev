namespace Sayhi.ApiService.Hubs
{
    public interface IChatService
    {
        Task UserConnected(HubCaller caller);
        Task UserDisconnected(HubCaller caller);
        Task SendMessage(HubCaller caller, Guid chatId, string text);
        Task SendTyping(HubCaller caller, Guid chatId, bool isTyping);
        Task Ring(HubCaller caller, Guid chatId, Guid calleeId);
        Task Hangup(HubCaller caller, Guid chatId, Guid calleeId);
        Task Join(HubCaller caller, Guid chatId);
        Task Leave(HubCaller caller, Guid chatId);
        Task AddAIToChat(HubCaller caller, Guid chatId);
        Task AddAgentToChat(HubCaller caller, Guid chatId);
        Task RemoveAIFromChat(HubCaller caller, Guid chatId);
        Task RemoveAgentFromChat(HubCaller caller, Guid chatId);
    }
}