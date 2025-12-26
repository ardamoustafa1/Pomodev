namespace Sayhi.ApiService.Models.Queries
{
    public interface IQueryParams
    {
        string? Order { get; }
        int Page { get; }
        int PageSize { get; }

        (string?, object[]) ToWhere();
        string[][] ToOrder();
    }

    public record BaseQueryParams(string? Order, int Page, int PageSize)
    {
        public string[][] ToOrder()
        {
            return Order == null
                ? Array.Empty<string[]>()
                : Order.Split(',').Select(i => i.Split(' ')).ToArray();
        }

        protected (string?, object[]) ToWhere(Dictionary<string, object> filtersAndParameters)
        {
            return (
                filtersAndParameters.Count == 0 ? null : string.Join(" and ", filtersAndParameters.Keys),
                filtersAndParameters.Values.ToArray());
        }
    }

    //public class QueryParams : IQueryParams
    //{
    //    public int Page { get; set; }
    //    public int PageSize { get; set; }
    //}
}