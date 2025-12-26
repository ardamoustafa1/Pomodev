namespace Sayhi.ApiService.Hubs
{
    public interface IChatHubClient
    {
        /*
        Task ReceiveMessage(string user, string message);
        Task UserJoined(string user);
        Task UserLeft(string user);
        Task TypingNotification(string user);
        Task MessageRead(string messageId);
        */

        Task ReceiveMessage(MessageDto chatMessageDto);
        Task ReceiveSuggestion(Guid messageId, string[] suggestions);
        Task UserLoggedIn(HubUser user);
        Task UserLoggedOut(HubUser user);
        Task ActiveUsers(ICollection<HubUser> users);
        Task ActiveAgents(ICollection<HubUser> users);
        Task Typing(Guid chatId, Guid senderId, bool isTyping);
        Task ReceiveRinging(Guid chatId, HubUser? caller);
        Task ReceiveHangup(Guid chatId, HubUser? caller);
        Task UserJoined(Guid chatId, HubUser user);
        Task UserLeft(Guid chatId, HubUser user);
        //Task ChatInfo(Guid chatId, ICollection<HubUser> users);
    }
}