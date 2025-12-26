using Sayhi.ApiService.Models.DTOs;
using Sayhi.ApiService.Models.Requests;
using Sayhi.Model;

namespace Sayhi.ApiService.Models
{
    public class Mapper : IMapper
    //public class Mapper<K, TEntity, TDto, TRequest> : IMapper<K, TEntity, TDto, TRequest>
        //where TEntity : class, IEntity<K>
        //where TDto : IDto<K>
        //where TRequest : IRequest<K, TEntity>
    {
        public TDto DomainToDto<K, TEntity, TDto>(TEntity item)
            where TEntity : class, IEntity<K>
            where TDto : IDto<K>
        {
            // Burada cast güvenli olmalı: AgentDto IDto<Guid> implement ediyor ve K == Guid olmalı.
            // Bu yüzden önce AgentDto'yu object'e sonra IDto<K>'ya cast ediyoruz.
            if (item is Agent agent)
                return (TDto)(IDto<K>)ConvertTo(agent);
                //return (IDto<K>)(object)ConvertTo(agent);

            if (item is Group group)
                return (TDto)(IDto<K>)ConvertTo(group);

            if (item is Queue queue)
                return (TDto)(IDto<K>)ConvertTo(queue);

            return default;
        }

        public TEntity DtoToDomain<K, TEntity, TDto>(TDto dto)
            where TEntity : class, IEntity<K>
            where TDto : IDto<K>
        {
            if (dto is AgentDto agentDto)
                return (TEntity)(IEntity<K>)ConvertTo(agentDto);

            if (dto is GroupDto groupDto)
                return (TEntity)(IEntity<K>)ConvertTo(groupDto);

            if (dto is QueueDto queueDto)
                return (TEntity)(IEntity<K>)ConvertTo(queueDto);

            return default;
        }

        public TEntity RequestToDomain<K, TEntity, TRequest>(TRequest request)
            where TEntity : class, IEntity<K>
            where TRequest : IRequest<K, TEntity>
        {
            if (request is AgentRequest agentRequest)
                return (TEntity)(IEntity<K>)ConvertTo(agentRequest);

            if (request is GroupRequest groupRequest)
                return (TEntity)(IEntity<K>)ConvertTo(groupRequest);

            //if (request is QueueRequest queueRequest)
            //    return (IEntity<K>)ConvertTo(queueRequest);

            return default;
        }

        /*
        if (request.GroupId.HasValue)
            agent.GroupId = request.GroupId.Value;

        if (request.Status.HasValue)
            agent.Status = request.Status.Value;

        agent.LastActivityAt = DateTime.UtcNow;
        */

        /*
        public Expression<Func<SetPropertyCalls<T>, SetPropertyCalls<T>>> UpdateFields<K, T>(IEntity<K> item, IRequest request)
            where T : class, IEntity<K>
        {
            //List<Expression<Func<SetPropertyCalls<T>, SetPropertyCalls<T>>>> setters = [];

            if (request is AgentRequest agentRequest)
            {
                Expression<Func<SetPropertyCalls<Agent>, SetPropertyCalls<Agent>>>[] setters =
                    [
                        setters => setters.SetProperty(b => b.Id, agentRequest.Id),
                        setters => setters.SetProperty(b => b.Name, agentRequest.Name)
                    ];

                Expression<Func<SetPropertyCalls<Agent>, SetPropertyCalls<Agent>>> r =
                    setters => setters
                        .SetProperty(b => b.Id, agentRequest.Id)
                        .SetProperty(b => b.Name, agentRequest.Name);
                return r;
            }
            else if (request is GroupRequest groupRequest)
            {

            }

            return [];
        }
        */

        //public Expression<Func<SetPropertyCalls<Agent>, SetPropertyCalls<Agent>>> UpdateFields(AgentRequest request)
        //{
        //    return setters => setters
        //        .SetProperty(b => b.Id, request.Id)
        //        .SetProperty(b => b.Name, request.Name);
        //}

        //public Expression<Func<SetPropertyCalls<Group>, SetPropertyCalls<Group>>> UpdateFields(GroupRequest request)
        //{
        //    return setters => setters
        //        .SetProperty(b => b.Name, request.Name)
        //        .SetProperty(b => b.Description, request.Description);
        //}

        //public Expression<Func<SetPropertyCalls<Queue>, SetPropertyCalls<Queue>>> UpdateFields(QueueRequest request)
        //{
        //    return setters => setters
        //        .SetProperty(b => b.Name, request.Name)
        //        .SetProperty(b => b.Description, request.Description);
        //}

        public AgentDto ConvertTo(Agent item)
        {
            return new AgentDto()
            {
                Id = item.Id,
                //Name = item.Name,
                Name = item.Person.Name,
                //Email = item.Email,
                Email = item.Person.Email ?? "",
                //PhoneNumber = item.PhoneNumber,
                PhoneNumber = item.Person.PhoneNumber,
                //AvatarUrl = item.AvatarUrl,
                AvatarUrl = item.Person.AvatarUrl,
                EmployeeId = item.EmployeeId,
                Status = item.Status,
                IsActive = item.IsActive,
                IsAvailable = item.IsAvailable,
                LastActivityAt = item.LastActivityAt,
                CreatedAt = item.CreatedAt
            };
        }

        public Agent ConvertTo(AgentDto dto)
        {
            return new Agent()
            {
                Id = dto.Id,
                EmployeeId = dto.EmployeeId,
                Status = dto.Status,
                LastActivityAt = dto.LastActivityAt,
                CreatedAt = dto.CreatedAt
            };
        }

        public Agent ConvertTo(AgentRequest request)
        {
            return new Agent()
            {
                Id = request.Id,
                //Name = request.Name ?? "",
                //Email = request.Email ?? "",
                //Password = request.Password ?? "",
                //PhoneNumber = request.PhoneNumber ?? "",
                //AvatarUrl = request.AvatarUrl ?? "",
                EmployeeId = request.EmployeeId,
                //AgentGroups = request.GroupId
            };
        }

        public AgentSkill ConvertTo(AddOrUpdateAgentSkillRequest request)
        {
            return new AgentSkill()
            {
                AgentId = request.AgentId,
                SkillId = request.SkillId,
                Proficiency = request.Proficiency,
                IsPrimary = request.IsPrimary
            };
        }

        public GroupDto ConvertTo(Group item)
        {
            return new GroupDto()
            {
                Id = item.Id,
                Name = item.Name,
                Description = item.Description,
                Type = item.Type,
                Manager = item.Manager,
                IsActive = item.IsActive,
                CreatedAt = item.CreatedAt
            };
        }

        public Group ConvertTo(GroupDto dto)
        {
            return new Group()
            {
                Id = dto.Id,
                Name = dto.Name,
                Description = dto.Description,
                Type = dto.Type,
                Manager = dto.Manager,
                IsActive = dto.IsActive,
                CreatedAt = dto.CreatedAt
            };
        }

        public Group ConvertTo(GroupRequest request)
        {
            return new Group()
            {
                //Id = request.Id,
                Name = request.Name ?? "",
                Description = request.Description,
                Type = request.Type ?? GroupType.Specialized,
                Manager = request.Manager,
                IsActive = request.IsActive ?? false
            };
        }

        public QueueDto ConvertTo(Queue item)
        {
            return new QueueDto()
            {
                Id = item.Id,
                Name = item.Name,
                Description = item.Description,
                Type = item.Type,
                Priority = item.Priority,
                MaxWaitTime = item.MaxWaitTime,
                MaxConcurrentCalls = item.MaxConcurrentCalls,
                IsActive = item.IsActive,
                Group = item.Group,
                CreatedAt = item.CreatedAt
            };
        }

        public Queue ConvertTo(QueueDto dto)
        {
            return new Queue()
            {
                Id = dto.Id,
                Name = dto.Name,
                Description = dto.Description,
                Type = dto.Type,
                Priority = dto.Priority,
                MaxWaitTime = dto.MaxWaitTime,
                MaxConcurrentCalls = dto.MaxConcurrentCalls,
                IsActive = dto.IsActive,
                Group = dto.Group,
                CreatedAt = dto.CreatedAt
            };
        }

        //public Queue ConvertTo(QueueRequest request)
        //{
        //    return new Queue()
        //    {
        //        //Id = request.Id,
        //        Name = request.Name ?? "",
        //        Description = request.Description,
        //        Type = request.Type ?? QueueType.Inbound,
        //        Priority = request.Priority,
        //        MaxWaitTime = request.MaxWaitTime,
        //        MaxConcurrentCalls = request.MaxConcurrentCalls,
        //        IsActive = request.IsActive,
        //        Group = request.Group,
        //        IsActive = request.IsActive ?? false
        //    };
        //}
    }
}