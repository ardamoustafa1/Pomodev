using Sayhi.Model;

namespace Sayhi.ApiService.Models.Queries
{
    public record AgentQueryParams(
         Guid? GroupId = null,
         AgentStatus? Status = null,
         bool IncludeSkills = false,
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
                filtersAndParameters.Add($"AgentGroups.Any(Id == @{filtersAndParameters.Count})", GroupId);
            }

            if (Status != null)
            {
                filtersAndParameters.Add($"{nameof(Status)} == @{filtersAndParameters.Count}", Status);
            }

            return base.ToWhere(filtersAndParameters);
        }
    }
}