namespace Sayhi.ApiService.Hubs
{
    public interface IChatHubService
    {
        //Task<string> SendMessage(MessageDto chatMessageDto);
        Task SendMessage(Guid chatId, string text);
        Task SendTyping(Guid chatId, bool isTyping);
        Task Ring(Guid chatId, Guid calleeId);
        Task Hangup(Guid chatId, Guid calleeId);
        Task Join(Guid chatId);
        Task Leave(Guid chatId);
        Task AddAIToChat(Guid chatId);
        Task AddAgentToChat(Guid chatId);
        Task RemoveAIFromChat(Guid chatId);
        Task RemoveAgentFromChat(Guid chatId);
    }
}