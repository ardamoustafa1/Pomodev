using System.Text;
using Sayhi.Model;

namespace Sayhi.ApiService.Models.Queries
{
    public record QueueQueryParams(
        Guid? GroupId = null,
        QueueType? Type = null,
        bool? IsActive = null,
        string? Order = null,
        int Page = 1,
        int PageSize = 20)
        : BaseQueryParams(Order, Page, PageSize), IQueryParams
    {
        public (string?, object[]) ToWhere()
        {
            Dictionary<string, object> filtersAndParameters = new();

            if (GroupId != null)
            {
                filtersAndParameters.Add($"{nameof(GroupId)} == @{filtersAndParameters.Count}",GroupId);
            }

            if (Type != null)
            {
                filtersAndParameters.Add($"{nameof(Type)} == @{filtersAndParameters.Count}", Type);
            }

            if (IsActive != null)
            {
                filtersAndParameters.Add($"{nameof(IsActive)} == @{filtersAndParameters.Count}", IsActive);
            }

            return base.ToWhere(filtersAndParameters);
        }
    }
}