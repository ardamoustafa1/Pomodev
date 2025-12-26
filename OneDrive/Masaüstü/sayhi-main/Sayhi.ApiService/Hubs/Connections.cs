using System.Collections.Concurrent;

namespace Sayhi.ApiService.Hubs
{
    public class Connections
    {
        private readonly ConcurrentDictionary<string, HubUser> connections = new();

        public bool Add(string connectionId, HubUser user)
        {
            return connections.TryAdd(connectionId, user);
        }

        public bool Add(HubUser user)
        {
            return Add(user.ConnectionId, user);
        }

        public HubUser AddOrUpdate(string connectionId, HubUser user)
        {
            return connections.AddOrUpdate(connectionId, user, (k, v) => user);
        }

        public HubUser AddOrUpdate(HubUser user)
        {
            return AddOrUpdate(user.ConnectionId, user);
        }

        public HubUser AddOrUpdate(string connectionId, Func<string, Guid, HubUser> action)
        {
            return connections.AddOrUpdate(connectionId, action("", Guid.Empty), (k, v) => action(v.Name, v.Id));
        }

        public HubUser? Remove(string connectionId)
        {
            return connections.TryRemove(connectionId, out HubUser? removed) ? removed : null;
        }

        public string? GetConnectionId(string username)
            => connections.FirstOrDefault(kv => kv.Value.Name == username).Key;

        public string? GetConnectionId(Guid userId)
            => connections.FirstOrDefault(kv => kv.Value.Id == userId).Key;

        public HubUser? Get(string username)
            => connections.FirstOrDefault(kv => kv.Value.Name == username).Value;

        public HubUser? Get(Guid userId)
            => connections.FirstOrDefault(kv => kv.Value.Id == userId).Value;

        public HubUser? GetUser(string connectionId)
            => connections.TryGetValue(connectionId, out var user) ? user : null;

        public ICollection<HubUser> GetAll() => connections.Values;

        public HubUser? Find(Func<HubUser, bool> criteria) => connections.Values.SingleOrDefault(criteria);
    }
}