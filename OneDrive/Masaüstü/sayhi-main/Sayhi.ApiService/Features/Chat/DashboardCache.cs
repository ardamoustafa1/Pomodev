using System.Collections.Concurrent;

namespace Sayhi.ApiService.Features.Chat
{
    public interface IDashboardCache
    {
        //void UserConnected(HubUser user);
        void AgentConnected(Guid userId);
        void CustomerConnected(Guid userId);
        //void UserDisconnected(HubUser user);
        void AgentDisconnected(Guid userId);
        void CustomerDisconnected(Guid userId);
        int GetActiveAgentCount();
        int GetActiveCustomerCount();
        //void AddOrUpdate(HubUser user);
        //void Remove(HubUser user);
        //int Count();
    }

    public class DashboardCache(/*IMemoryCache memoryCache*/) : IDashboardCache
    {
        //private const string Last100HubUserKey = "Last100HubUser";

        private static readonly ConcurrentDictionary<Guid, DateTime> agentActivities = new();
        private static readonly ConcurrentDictionary<Guid, DateTime> customerActivities = new();

        private readonly TimeSpan timeWindow = TimeSpan.FromMinutes(60);

        //public void UserConnected(HubUser user)
        //{
        //    if (user.Type == HubUserType.Agent)
        //        agentActivities.AddOrUpdate(user.Id, DateTime.UtcNow, (k, v) => DateTime.UtcNow);
        //    else if (user.Type == HubUserType.Customer)
        //        customerActivities.AddOrUpdate(user.Id, DateTime.UtcNow, (k, v) => DateTime.UtcNow);
        //}

        public void AgentConnected(Guid userId)
        {
            agentActivities.AddOrUpdate(userId, DateTime.UtcNow, (k, v) => DateTime.UtcNow);
        }

        public void CustomerConnected(Guid userId)
        {
            customerActivities.AddOrUpdate(userId, DateTime.UtcNow, (k, v) => DateTime.UtcNow);
        }

        //public void UserDisconnected(HubUser user)
        //{
        //    if (user.Type == HubUserType.Agent)
        //        agentActivities.TryRemove(user.Id, out var _);
        //    else if (user.Type == HubUserType.Customer)
        //        customerActivities.TryRemove(user.Id, out var _);
        //}

        public void AgentDisconnected(Guid userId)
        {
            agentActivities.TryRemove(userId, out var _);
        }

        public void CustomerDisconnected(Guid userId)
        {
            customerActivities.TryRemove(userId, out var _);
        }

        public int GetActiveAgentCount()
        {
            DateTime now = DateTime.UtcNow;
            int activeCount = 0;

            // Geçerli olan (son 60 dakika içinde aktif olan) girişleri say
            foreach (var pair in agentActivities)
            {
                if (now - pair.Value <= timeWindow)
                {
                    activeCount++;
                }
            }

            // Opsiyonel: Bellek temizliği için 60 dakikadan eski girişleri temizle
            // Bu adım performansı etkileyebilir, yoğunluk düşükse uygulanabilir.
            CleanUpOldEntries(now, agentActivities);

            return activeCount;
        }

        public int GetActiveCustomerCount()
        {
            DateTime now = DateTime.UtcNow;
            int activeCount = 0;

            foreach (var pair in customerActivities)
            {
                if (now - pair.Value <= timeWindow)
                {
                    activeCount++;
                }
            }

            CleanUpOldEntries(now, customerActivities);

            return activeCount;
        }

        //public void AddOrUpdate(HubUser user)
        //{
        //    List<HubUser> list = GetLast100HubUserKey();

        //    lock (list)
        //    {
        //        list.Insert(0, user);
        //        if (list.Count > 100)
        //            list.RemoveRange(100, list.Count - 100);
        //    }
        //}

        //public void Remove(HubUser user)
        //{
        //    List<HubUser> list = GetLast100HubUserKey();

        //    lock (list)
        //    {
        //        //list.IndexOf(user);
        //        list.Remove(user);
        //    }
        //}

        //public int Count()
        //{
        //    List<HubUser> list = GetLast100HubUserKey();

        //    return list.Count;
        //}

        //private List<HubUser> GetLast100HubUserKey()
        //{
        //    List<HubUser>? list = memoryCache.GetOrCreate(Last100HubUserKey, entry =>
        //    {
        //        entry.SlidingExpiration = TimeSpan.FromMinutes(10);
        //        return new List<HubUser>();
        //    });

        //    return list!;
        //}

        private void CleanUpOldEntries(DateTime now, ConcurrentDictionary<Guid, DateTime> activities)
        {
            IEnumerable<Guid> keysToRemove = activities
                .Where(pair => now - pair.Value > timeWindow)
                .Select(pair => pair.Key);

            foreach (Guid key in keysToRemove)
            {
                activities.TryRemove(key, out _);
            }
        }
    }
}
