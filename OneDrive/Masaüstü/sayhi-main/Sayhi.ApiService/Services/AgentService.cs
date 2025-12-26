using Sayhi.ApiService.Data;
using Sayhi.ApiService.Models;
using Sayhi.ApiService.Models.DTOs;
using Sayhi.ApiService.Models.Queries;
using Sayhi.ApiService.Models.Requests;
using Sayhi.ApiService.Repositories;
using Sayhi.Model;

namespace Sayhi.ApiService.Services
{
    public interface IAgentService : IBaseService<Guid, Agent, AgentDto, AgentRequest>
    {
        Task<bool> SetAgentStatus(Guid id, AgentStatus status, CancellationToken cancellationToken = default);

        //Task<List<AgentSkillDto>> GetAgentSkillsAsync(Guid agentId, CancellationToken cancellationToken = default);
        //Task<bool> AddAgentSkillAsync(Guid agentId, AddAgentSkillRequest request, CancellationToken cancellationToken = default);
        //Task<bool> RemoveAgentSkillAsync(Guid agentId, Guid skillId, CancellationToken cancellationToken = default);
        //Task<bool> UpdateAgentSkillAsync(Guid agentId, Guid skillId, UpdateAgentSkillRequest request, CancellationToken cancellationToken = default);

        //Task<List<QueueAssignmentDto>> GetAgentQueueAssignmentsAsync(Guid agentId, CancellationToken cancellationToken = default);
        //Task<AgentStatsDto> GetAgentStatsAsync(Guid agentId, CancellationToken cancellationToken = default);
        //Task<bool> IsAgentAvailableAsync(Guid agentId, CancellationToken cancellationToken = default);
    }

    public class AgentService(
        IAgentRepository agentRepository,
        IPersonRepository personRepository,
        //IAgentGroupRepository agentGroupRepository,
        //IAgentSkillRepository agentSkillRepository,
        //IQueueAssignmentRepository queueAssignmentRepository,
        IMapper mapper,
        IValidator validator,
        ILogger<AgentService> logger)
        : BaseService<Guid, Agent, AgentDto, AgentRequest>(agentRepository, mapper, validator, logger)
        , IAgentService
    {
        public override async Task<AgentDto> Add(AgentRequest request, CancellationToken cancellationToken = default)
        {
            Person person = await personRepository.Add(
                new Person()
                {
                    Id = request.Id,
                    Email = request.Email,
                    Name = request.Name ?? "",
                    Password = Utils.Hash(request.Password ?? "1"),
                    AvatarUrl = request.AvatarUrl ?? $"https://api.dicebear.com/7.x/avataaars/svg?seed={request.Name}",
                    PhoneNumber = request.PhoneNumber
                },
                cancellationToken);

            AgentDto agentDto = await base.Add(request, cancellationToken);

            //AgentGroup agentGroup = await agentGroupRepository.Add(
            //    new AgentGroup() { AgentId = request.Id, GroupId = request.GroupId });

            //AgentSkill agentSkill = await agentSkillRepository.Add(
            //    new AgentSkill() { AgentId = request.Id, SkillId = skillEnglish.Id, Proficiency = ProficiencyLevel.Advanced, IsPrimary = true });

            //QueueAssignment queueAssignment = await queueAssignmentRepository.Add(
            //    new QueueAssignment() { AgentId = request.Id, QueueId = queueInboundMain.Id, Priority = 1 });

            return agentDto;
        }

        public Task<bool> SetAgentStatus(Guid id, AgentStatus status, CancellationToken cancellationToken = default)
        {
            return Try(async () =>
            {
                Agent? agent = await agentRepository.GetById(id, cancellationToken);

                if (agent == null)
                    return false;

                agent.Status = status;
                agent.LastActivityAt = DateTime.UtcNow;

                await agentRepository.Update(agent, cancellationToken);

                logger.LogInformation("Agent status updated to {Status} for agent ID: {AgentId}", status, id);
                return true;
            });
        }

        /*
        public async Task<List<AgentSkillDto>> GetAgentSkillsAsync(Guid agentId)
        {
            try
            {
                var agentSkills = await _agentRepository.GetAgentSkillsAsync(agentId);
                return _mapper.Map<List<AgentSkillDto>>(agentSkills);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving skills for agent {AgentId}", agentId);
                throw;
            }
        }

        public async Task<bool> AddAgentSkillAsync(Guid agentId, AddAgentSkillRequest request)
        {
            try
            {
                var agent = await _agentRepository.GetByIdAsync(agentId);
                if (agent == null)
                    return false;

                var skill = await _skillRepository.GetByIdAsync(request.SkillId);
                if (skill == null)
                    throw new ArgumentException($"Skill with ID {request.SkillId} not found");

                var existingSkill = await _agentRepository.GetAgentSkillAsync(agentId, request.SkillId);
                if (existingSkill != null)
                    throw new ArgumentException($"Agent already has skill with ID {request.SkillId}");

                var agentSkill = new AgentSkill
                {
                    AgentId = agentId,
                    SkillId = request.SkillId,
                    Proficiency = request.Proficiency,
                    IsPrimary = request.IsPrimary,
                    CertifiedAt = DateTime.UtcNow
                };

                await _agentRepository.AddAgentSkillAsync(agentSkill);
                await _agentRepository.SaveChangesAsync();

                _logger.LogInformation("Skill {SkillId} added to agent {AgentId}", request.SkillId, agentId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding skill {SkillId} to agent {AgentId}", request.SkillId, agentId);
                throw;
            }
        }

        public async Task<bool> RemoveAgentSkillAsync(Guid agentId, Guid skillId)
        {
            try
            {
                var result = await _agentRepository.RemoveAgentSkillAsync(agentId, skillId);
                if (result)
                {
                    await _agentRepository.SaveChangesAsync();
                    _logger.LogInformation("Skill {SkillId} removed from agent {AgentId}", skillId, agentId);
                }
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing skill {SkillId} from agent {AgentId}", skillId, agentId);
                throw;
            }
        }

        public async Task<bool> UpdateAgentSkillAsync(Guid agentId, Guid skillId, UpdateAgentSkillRequest request)
        {
            try
            {
                var agentSkill = await _agentRepository.GetAgentSkillAsync(agentId, skillId);
                if (agentSkill == null)
                    return false;

                agentSkill.Proficiency = request.Proficiency;
                agentSkill.IsPrimary = request.IsPrimary;

                await _agentRepository.UpdateAgentSkillAsync(agentSkill);
                await _agentRepository.SaveChangesAsync();

                _logger.LogInformation("Skill {SkillId} updated for agent {AgentId}", skillId, agentId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating skill {SkillId} for agent {AgentId}", skillId, agentId);
                throw;
            }
        }

        public async Task<List<QueueAssignmentDto>> GetAgentQueueAssignmentsAsync(Guid agentId)
        {
            try
            {
                var assignments = await _agentRepository.GetAgentQueueAssignmentsAsync(agentId);
                return _mapper.Map<List<QueueAssignmentDto>>(assignments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving queue assignments for agent {AgentId}", agentId);
                throw;
            }
        }

        public async Task<AgentStatsDto> GetAgentStatsAsync(Guid agentId)
        {
            try
            {
                var stats = await _agentRepository.GetAgentStatsAsync(agentId);
                return stats ?? new AgentStatsDto { AgentId = agentId };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving stats for agent {AgentId}", agentId);
                throw;
            }
        }

        public async Task<bool> IsAgentAvailableAsync(Guid agentId)
        {
            try
            {
                var agent = await _agentRepository.GetByIdAsync(agentId);
                return agent?.Status == AgentStatus.Available;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking availability for agent {AgentId}", agentId);
                throw;
            }
        }

        private async Task ValidateCreateAgentRequestAsync(CreateAgentRequest request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            // Check if person is already an agent
            var existingAgent = await _agentRepository.GetByPersonIdAsync(request.PersonId);
            if (existingAgent != null)
                throw new ArgumentException($"Person with ID {request.PersonId} is already an agent");

            // Validate group exists if provided
            if (request.GroupId.HasValue)
            {
                // This would require a group repository
                // var group = await _groupRepository.GetByIdAsync(request.GroupId.Value);
                // if (group == null)
                //     throw new ArgumentException($"Group with ID {request.GroupId} not found");
            }
        }
        */
    }
}