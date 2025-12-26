using Microsoft.EntityFrameworkCore.Query;
using Sayhi.Model;

namespace Sayhi.ApiService.Models.Requests
{
    //public interface IRequest<K>

    //public interface IRequest<K, TSelf>
    //where TSelf : IRequest<K, TSelf>

    public interface IRequest<K, TEntity>
        where TEntity : class, IEntity<K>
    {
        //K Id { get; }

        //Expression<Func<SetPropertyCalls<TEntity>, SetPropertyCalls<TEntity>>> UpdateFields();
        Action<UpdateSettersBuilder<TEntity>> UpdateFields();
        TEntity UpdateFields(TEntity current);
    }

    //public class Request<K> : IRequest<K>
    //{
    //    public K Id { get; set; }
    //}
}