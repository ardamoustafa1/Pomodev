using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Sayhi.ApiService.Data;
using Sayhi.Model;

namespace Sayhi.ApiService.Repositories
{
    public interface IAgentRepository : IBaseRepository<Guid, Agent>
    {
    }

    public class AgentRepository(AppDbContext db)
        : BaseRepository<Guid, Agent>(db), IAgentRepository
    {
        public override IQueryable<Agent> Get()
        {
            return db.Agents
                .Include(a => a.Person);
        }

        //public override Task<int> Update(
        //   Expression<Func<Agent, bool>> filter,
        //   Expression<Func<SetPropertyCalls<Agent>, SetPropertyCalls<Agent>>> setters,
        //   CancellationToken cancellationToken = default)
        //{
        //    return base.Update(filter, setters, cancellationToken);
        //}

        /*
        // Belirli bir kuyruktaki aktif agent'ları getir
        var agentsInQueue = await _context.QueueAssignments
            .Where(qa => qa.QueueId == vipCustomerQueue.Id && qa.IsActive)
            .Include(qa => qa.Agent)
                .ThenInclude(a => a.Person)
            .Include(qa => qa.Agent)
                .ThenInclude(a => a.AgentSkills)
                .ThenInclude(as => as.Skill)
            .OrderBy(qa => qa.Priority)
            .Select(qa => qa.Agent)
            .ToListAsync();

        // Agent'ın atandığı kuyrukları getir
        var agentQueues = await _context.QueueAssignments
            .Where(qa => qa.AgentId == agent1.Id && qa.IsActive)
            .Include(qa => qa.Queue)
            .OrderBy(qa => qa.Priority)
            .Select(qa => qa.Queue)
            .ToListAsync();

        var queueAssignmentsView = await _context.QueueAssignments
            .Where(qa => qa.IsActive)
            .Include(qa => qa.Agent)
                .ThenInclude(a => a.Person)
            .Include(qa => qa.Queue)
            .Select(qa => new QueueAssignmentViewModel
            {
                Id = qa.Id,
                AgentName = qa.Agent.Person.Name,
                QueueName = qa.Queue.Name,
                Priority = qa.Priority,
                AssignedAt = qa.AssignedAt,
                IsActive = qa.IsActive,
                CallsHandled = qa.CallsHandled
            })
            .ToListAsync();
            */
    }
}
