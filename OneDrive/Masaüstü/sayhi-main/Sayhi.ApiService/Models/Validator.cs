using Sayhi.ApiService.Models.Requests;
using Sayhi.Model;

namespace Sayhi.ApiService.Models
{
    public class Validator : IValidator
    {
        public Task Validate<TRequest>(TRequest request, CancellationToken cancellationToken = default)
        {
            return Task.CompletedTask;
        }

        //Task Validate<K>(IDto<K> dto, CancellationToken cancellationToken = default);
        //Task Validate<K>(IEntity<K> domain, CancellationToken cancellationToken = default);
        //Task Validate<K>(IQueryParams<K> query, CancellationToken cancellationToken = default);

        public Task Validate(SetAgentStatusRequest request)
        {
            return Task.CompletedTask;
        }

        public Task Validate(AssignAgentToQueueRequest request)
        {
            return Task.CompletedTask;
        }

        public Task Validate(AddOrUpdateAgentSkillRequest request)
        {
            return Task.CompletedTask;
        }

        public Task Validate(AgentRequest request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            // Check if person is already an agent
            /*
            var existingAgent = await agentRepository.GetByPersonIdAsync(request.PersonId);
            if (existingAgent != null)
                throw new ArgumentException($"Person with ID {request.PersonId} is already an agent");
            */

            // Validate group exists if provided
            if (request.GroupId.HasValue)
            {
                // This would require a group repository
                // var group = await _groupRepository.GetByIdAsync(request.GroupId.Value);
                // if (group == null)
                //     throw new ArgumentException($"Group with ID {request.GroupId} not found");
            }

            return Task.CompletedTask;
        }
    }
}