using System.Linq.Dynamic.Core;
using System.Runtime.CompilerServices;
using Microsoft.EntityFrameworkCore;
using Sayhi.ApiService.Models;
using Sayhi.ApiService.Models.DTOs;
using Sayhi.ApiService.Models.Queries;
using Sayhi.ApiService.Models.Requests;
using Sayhi.ApiService.Repositories;
using Sayhi.Model;

namespace Sayhi.ApiService.Services
{
    public interface IBaseService<K, TEntity, TDto, TRequest>
        where TEntity : class, IEntity<K>
        where TDto : IDto<K>
        where TRequest : IRequest<K, TEntity>
    {
        ////Task<IEnumerable<IDto<K>>> Get(IQueryParams queryParams, CancellationToken cancellationToken = default);
        //Task<IEnumerable<TDto>> Get(IQueryParams queryParams, CancellationToken cancellationToken = default);
        Task<PaginatedResponse<TDto>> Get(IQueryParams queryParams, CancellationToken cancellationToken = default);
        Task<TDto?> GetById(K id, CancellationToken cancellationToken = default);
        Task<TDto> Add(TRequest request, CancellationToken cancellationToken = default);
        Task<TDto?> Update(K id, TRequest request, CancellationToken cancellationToken = default);
        Task<bool> Remove(K id, CancellationToken cancellationToken = default);
    }

    public class BaseService<K, TEntity, TDto, TRequest>(
        //IBaseRepository<K, IEntity<K>> repository,
        IBaseRepository<K, TEntity> repository,
        IMapper mapper,
        IValidator validator,
        ILogger<BaseService<K, TEntity, TDto, TRequest>> logger
    ) : IBaseService<K, TEntity, TDto, TRequest>
        where TEntity : class, IEntity<K>
        where TDto : IDto<K>
        where TRequest : IRequest<K, TEntity>//, IRequest<K, IEntity<K>>
    {
        protected async Task<R> Try<R>(Func<Task<R>> action, [CallerMemberName] string? caller = null)
        {
            try
            {
                return await action();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in {Method} with {Item}", caller, typeof(K).Name);
                throw;
            }
        }

        ////public Task<IEnumerable<IDto<K>>> Get(IQueryParams queryParams, CancellationToken cancellationToken = default)
        //public async Task<IEnumerable<TDto>> Get(IQueryParams queryParams, CancellationToken cancellationToken = default)
        public Task<PaginatedResponse<TDto>> Get(IQueryParams queryParams, CancellationToken cancellationToken = default)
        {
            return Try(async () =>
            //try
            {
                /*
                string[][] order = queryParams.ToOrder();
                (string? filter, object[] parameters) = queryParams.ToWhere();
                IQueryable<TEntity> query = await repository.Get(
                    filter, parameters, order, queryParams.Page, queryParams.PageSize,
                    cancellationToken);
                if (filter != null)
                    query = query.Where(filter, parameters);
                */

                IQueryable<TEntity> query = repository.Get();

                query = ApplyWhere(query, queryParams.ToWhere());

                query = ApplyOrder(query, queryParams.ToOrder());

                query = query
                    .Skip((queryParams.Page - 1) * queryParams.PageSize)
                    .Take(queryParams.PageSize);

                /*
                public record PagesResponse<TDto>(
                    IEnumerable<TDto> Items,
                    int TotalCount,
                    int TotalPages,
                    int Page,
                    int PageSize);
                */

                List<TDto> items = await query
                    .Select(i => mapper.DomainToDto<K, TEntity, TDto>(i))
                    .ToListAsync(cancellationToken);

                return new PaginatedResponse<TDto>(
                    items,
                    queryParams.Page,
                    queryParams.PageSize);
            });
            //}
            //catch (Exception ex)
            //{
            //    logger.LogError(ex, "Error retrieving agents with params: {@Params}", queryParams);
            //    throw;
            //}
        }

        public Task<TDto?> GetById(K id, CancellationToken cancellationToken = default)
        {
            return Try(async () =>
            {
                TEntity? item = await repository.GetById(id, cancellationToken);
                return item != null
                    //? _mapper.Map<TDto>(item)
                    ? mapper.DomainToDto<K, TEntity, TDto>(item)
                    : default;
            });
            //catch (Exception ex)
            //{
            //    logger.LogError(ex, "Error retrieving agent with ID: {AgentId}", id);
            //    throw;
            //}
        }

        public virtual Task<TDto> Add(TRequest request, CancellationToken cancellationToken = default)
        {
            return Try(async () =>
            {
                // Validation
                await validator.Validate(request, cancellationToken);

                // Check if person exists
                // ...

                //IEntity<K> item = mapper.ConvertTo<K>(request);
                //TEntity item = (TEntity)mapper.ConvertTo<K, TEntity>(request);
                TEntity item = mapper.RequestToDomain<K, TEntity, TRequest>(request);

                /*
                int effectedRowCount = await repository.Add(item, cancellationToken);

                if (effectedRowCount != 1)
                    throw new InvalidOperationException($"{typeof(TEntity).Name} created with Id: {item.Id}. effectedRowCount {effectedRowCount}");
                */
                TEntity itemAdded = await repository.Add(item, cancellationToken);

                //logger.LogInformation("{Item} created with Id: {Id}", typeof(K).Name, item.Id);

                return mapper.DomainToDto<K, TEntity, TDto>(itemAdded);
            });
            //catch (Exception ex)
            //{
            //    logger.LogError(ex, "Error creating {Item} with request: {@Request}", typeof(K).Name, request);
            //    throw;
            //}
        }

        public Task<TDto?> Update(K id, TRequest request, CancellationToken cancellationToken = default)
        {
            return Try(async () =>
            {
                /*
                await repository.Update(
                    x => Equals(x.Id, id),
                    request.UpdateFields(),
                    cancellationToken);
                */

                TEntity? item = await repository.GetById(id, cancellationToken);
                if (item == null)
                    return default;

                request.UpdateFields(item);

                int effectedRowCount = await repository.Update(
                    item,
                    cancellationToken);

                //logger.LogInformation("{Item} updated with Id: {Id}. effectedRowCount {effectedRowCount}", typeof(TEntity).Name, id, effectedRowCount);
                //logger.LogInformation("{@Updated}", updated);

                if (effectedRowCount != 1)
                    throw new InvalidOperationException($"{typeof(TEntity).Name} updated with Id: {id}. effectedRowCount {effectedRowCount}");

                return mapper.DomainToDto<K, TEntity, TDto>(item);
            });
            //catch (Exception ex)
            //{
            //    logger.LogError(ex, "Error updating {Item} {Id} with request: {@Request}", typeof(K).Name, id, request);
            //    throw;
            //}
        }

        public Task<bool> Remove(K id, CancellationToken cancellationToken = default)
        {
            return Try(async () =>
            {
                /// Soft delete ??
                //var item = await repository.GetById(id, cancellationToken);
                //if (item == null)
                //    return false;
                //agent.Status = AgentStatus.Away;
                //agent.LastActivityAt = DateTime.UtcNow;
                //await repository.Update(item, cancellationToken);

                int effectedRowCount = await repository.Remove(id, cancellationToken);

                if (effectedRowCount != 1)
                    throw new InvalidOperationException($"{typeof(TEntity).Name} deleted with Id: {id}. effectedRowCount {effectedRowCount}");

                //logger.LogInformation("{Item} deleted with Id: {Id}. effectedRowCount {effectedRowCount}", typeof(K).Name, id, effectedRowCount);

                return true;
            });
            //catch (Exception ex)
            //{
            //    logger.LogError(ex, "Error deleting {Item} {Id}", typeof(K).Name, id);
            //    throw;
            //}
        }

        private IQueryable<TEntity> ApplyWhere(IQueryable<TEntity> query, (string?, object[]) filtersAndParameters)
        {
            (string? filter, object[] parameters) = filtersAndParameters;

            // AgentQueryParams { Order = , Page = 1, PageSize = 20, GroupId = , Status = , IncludeSkills = False }
            //Console.WriteLine($"TEntity {typeof(TEntity).Name}");
            //Console.WriteLine($"filter {filter}");

            /*
            .Where(a => a.Department.Name == "IT")
            .Where(a => a.Departments.Any(d => d.Name == "IT"));

             .Include(a => a.Department)
                .Where("Department.Name.Contains(@0) AND Name.StartsWith(@1)", "IT", "J");
                .Where("Department != null && Department.Name == @0", "IT");

            .Where("Departments.Any(Id == @0)", "IT");


             */

            if (filter != null)
                return query.Where(filter, parameters);

            return query;
        }

        private IQueryable<TEntity> ApplyOrder(IQueryable<TEntity> query, string[][] order)
        {
            if (order.Length > 0)
            {
                string orderString = string.Join(", ",
                    order
                        .Where(i => !string.IsNullOrWhiteSpace(i[0]))
                        .Select(i => $"{NormalizeColumn(i[0])} {NormalizeDirection(i[1])}".Trim()));

                if (!string.IsNullOrEmpty(orderString))
                {
                    return query.OrderBy(orderString);
                }
            }

            return query;
        }

        private static string NormalizeColumn(string column)
        {
            string[] allowedColumns = ["Name", "CreatedAt", "Id"];

            if (!allowedColumns.Contains(column))
                return allowedColumns.First();

            return column;
        }

        private static string NormalizeDirection(string? direction)
            => direction == "desc" ? "desc" : direction == "asc" ? "asc" : "";
    }
}