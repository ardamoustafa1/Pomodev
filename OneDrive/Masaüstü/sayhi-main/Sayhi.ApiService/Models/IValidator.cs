using Sayhi.ApiService.Models.Requests;
using Sayhi.Model;

namespace Sayhi.ApiService.Models
{
    public interface IValidator
    {
        Task Validate<TRequest>(TRequest request, CancellationToken cancellationToken = default);
        //Task Validate<K>(IDto<K> dto, CancellationToken cancellationToken = default);
        //Task Validate<K>(IEntity<K> domain, CancellationToken cancellationToken = default);
        //Task Validate<K>(IQueryParams<K> query, CancellationToken cancellationToken = default);
    }
}