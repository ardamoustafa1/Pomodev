using System.Linq.Dynamic.Core;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Query;
using Sayhi.Model;

namespace Sayhi.ApiService.Repositories
{
    public interface IBaseRepository<K, TEntity>
        where TEntity : class, IEntity<K>
    {
        //Task<IQueryable<TEntity>> Get(string? filter, object[] parameters, string[][] order, int page, int pageSize, CancellationToken cancellationToken = default);
        IQueryable<TEntity> Get();
        IQueryable<TEntity> Get(Expression<Func<TEntity, bool>> filter);
        //IQueryable<TEntity> Query(Expression<Func<TEntity, bool>> filter);
        Task<TEntity?> GetById(K id, CancellationToken cancellationToken = default);
        Task<TEntity?> Find(Expression<Func<TEntity, bool>> filter, CancellationToken cancellationToken = default);
        Task<TEntity> Add(TEntity item, CancellationToken cancellationToken = default);
        Task<int> Update(TEntity item, CancellationToken cancellationToken = default);
        //Task<int> Update<TProperty>(
        Task<int> Update(
            Expression<Func<TEntity, bool>> filter,
            //Expression<Func<SetPropertyCalls<TEntity>, SetPropertyCalls<TEntity>>> setter,
            Action<UpdateSettersBuilder<TEntity>> setter,
            CancellationToken cancellationToken = default);
        Task<int> Remove(K id, CancellationToken cancellationToken = default);
        Task<int> Remove(Expression<Func<TEntity, bool>> filter, CancellationToken cancellationToken = default);
    }

    public abstract class BaseRepository<K, TEntity>(DbContext db) : IBaseRepository<K, TEntity>
        where TEntity : class, IEntity<K>
    {
        //public virtual async Task<IQueryable<TEntity>> Get(
        //    string? filter,
        //    object[] parameters,
        //    string[][] order,
        //    int page,
        //    int pageSize,
        //    CancellationToken cancellationToken = default)
        public virtual IQueryable<TEntity> Get()
        {
            return db.Set<TEntity>();
            //return db.Set<TEntity>().AsQueryable();
        }

        public virtual IQueryable<TEntity> Get(Expression<Func<TEntity, bool>> filter)
        //public virtual async Task<IQueryable<TEntity>> Query(Expression<Func<TEntity, bool>> filter, CancellationToken cancellationToken = default)
        {
            return Get()
                .Where(filter);
            //.ToArrayAsync(cancellationToken);
        }

        public virtual Task<TEntity?> GetById(K id, CancellationToken cancellationToken = default)
        {
            //return await db.Set<TEntity>().FindAsync(id, cancellationToken);
            return Get()
                .SingleOrDefaultAsync(x => Equals(x.Id, id), cancellationToken);
        }

        public virtual Task<TEntity?> Find(Expression<Func<TEntity, bool>> filter, CancellationToken cancellationToken = default)
        {
            return db
                .Set<TEntity>()
                .SingleOrDefaultAsync(filter, cancellationToken);
        }

        /*
        public virtual Task<int> Add(TEntity item, CancellationToken cancellationToken = default)
        {
            db.Set<TEntity>().Add(item);
            return db.SaveChangesAsync(cancellationToken);
        }
        */

        public virtual async Task<TEntity> Add(TEntity item, CancellationToken cancellationToken = default)
        {
            EntityEntry<TEntity> itemAdded = db.Set<TEntity>().Add(item);
            //return db.SaveChangesAsync(cancellationToken);
            int effectedRowCound = await db.SaveChangesAsync(cancellationToken);

            if (effectedRowCound == 0)
                throw new InvalidOperationException("Can't insert data into DB");

            return itemAdded.Entity;
        }

        public virtual Task<int> Update(TEntity item, CancellationToken cancellationToken = default)
        {
            db.Set<TEntity>().Update(item);
            return db.SaveChangesAsync(cancellationToken);
        }

        /*
        public virtual Task<int> Update(
            Expression<Func<TEntity, bool>> filter,
            //Func<TEntity, TProperty> propertyExpression,
            //Func<TEntity, TProperty> valueExpression,
            //params (Expression<Func<TEntity, TProperty>> property, Expression<Func<TEntity, TProperty>> value)[] setters)
            //params (LambdaExpression property, LambdaExpression value)[] setters)
            Expression<Func<SetPropertyCalls<TEntity>, SetPropertyCalls<TEntity>>> setter,
            CancellationToken cancellationToken = default)
        {
            ParameterExpression? parameter = Expression.Parameter(typeof(SetPropertyCalls<TEntity>), "s");
            Expression body = Expression.Invoke(setter, parameter);
            var lambda = Expression.Lambda<Func<SetPropertyCalls<TEntity>, SetPropertyCalls<TEntity>>>(body, parameter);

            return db
                .Set<TEntity>()
                .Where(filter)
                .ExecuteUpdateAsync(lambda, cancellationToken);
        }
        */

        public virtual Task<int> Update(
            Expression<Func<TEntity, bool>> filter,
            Action<UpdateSettersBuilder<TEntity>> setter,
            CancellationToken cancellationToken = default)
        {
            return db
                .Set<TEntity>()
                .Where(filter)
                .ExecuteUpdateAsync(setter, cancellationToken);
        }

        public virtual async Task<int> Remove(K id, CancellationToken cancellationToken = default)
        {
            TEntity? item = await db
                .Set<TEntity>()
                .FindAsync(id, cancellationToken);

            if (item == null)
                return 0;

            db.Set<TEntity>().Remove(item);
            return await db.SaveChangesAsync(cancellationToken);
        }

        public virtual Task<int> Remove(Expression<Func<TEntity, bool>> filter, CancellationToken cancellationToken = default)
        {
            return db
                .Set<TEntity>()
                .Where(filter)
                .ExecuteDeleteAsync(cancellationToken);
        }
    }
}
