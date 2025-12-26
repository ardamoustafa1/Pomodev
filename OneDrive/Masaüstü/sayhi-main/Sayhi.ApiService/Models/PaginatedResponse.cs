namespace Sayhi.ApiService.Models
{
    public record PaginatedResponse<TDto>(
        IEnumerable<TDto> Items,
        //int TotalCount,
        //int TotalPages,
        int Page,
        int PageSize);
    //where TDto : IDto<K>;
}