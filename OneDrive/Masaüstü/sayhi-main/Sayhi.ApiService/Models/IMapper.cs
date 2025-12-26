using Sayhi.ApiService.Models.DTOs;
using Sayhi.ApiService.Models.Requests;
using Sayhi.Model;

namespace Sayhi.ApiService.Models
{
    //public interface IMapper<K, TEntity, TDto, TRequest>
    //    where TEntity : class, IEntity<K>
    //    where TDto : IDto<K>
    //    where TRequest : IRequest<K, TEntity>
    public interface IMapper
    {
        TDto DomainToDto<K, TEntity, TDto>(TEntity item)
            where TEntity : class, IEntity<K>
            where TDto : IDto<K>;

        TEntity DtoToDomain<K, TEntity, TDto>(TDto dto)
            where TEntity : class, IEntity<K>
            where TDto : IDto<K>;

        TEntity RequestToDomain<K, TEntity, TRequest>(TRequest request)
            where TEntity : class, IEntity<K>
            where TRequest : IRequest<K, TEntity>;

        //Expression<Func<SetPropertyCalls<Agent>, SetPropertyCalls<Agent>>> UpdateFields(AgentRequest request);
        //Expression<Func<SetPropertyCalls<Group>, SetPropertyCalls<Group>>> UpdateFields(GroupRequest request);
        //Expression<Func<SetPropertyCalls<Queue>, SetPropertyCalls<Queue>>> UpdateFields(QueueRequest request);

        AgentDto ConvertTo(Agent domain);

        Agent ConvertTo(AgentRequest request);

        AgentSkill ConvertTo(AddOrUpdateAgentSkillRequest request);
    }
}