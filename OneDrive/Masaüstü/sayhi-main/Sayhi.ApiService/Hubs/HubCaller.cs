namespace Sayhi.ApiService.Hubs
{
    public record HubCaller(string ConnectionId, string Name, HubUserType Type);
}