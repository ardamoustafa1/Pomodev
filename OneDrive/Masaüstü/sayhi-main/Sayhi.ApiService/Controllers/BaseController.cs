using Microsoft.AspNetCore.Mvc;
using Sayhi.ApiService.Models;
using Sayhi.ApiService.Models.DTOs;
using Sayhi.ApiService.Models.Queries;
using Sayhi.ApiService.Models.Requests;
using Sayhi.ApiService.Services;
using Sayhi.Model;

namespace Sayhi.ApiService.Controllers
{
    //[ApiController]
    //[Route("api/[controller]")]
    public class BaseController<K, TEntity, TDto, TQueryParams, TRequest>(
        IBaseService<K, TEntity, TDto, TRequest> service,
        ILogger<BaseController<K, TEntity, TDto, TQueryParams, TRequest>> logger)
        : ControllerBase
        where TEntity : class, IEntity<K>
        where TDto : IDto<K>
        where TQueryParams : IQueryParams
        where TRequest : IRequest<K, TEntity>
    {
        [HttpGet]
        public async Task<ActionResult<PaginatedResponse<TDto>>> GetSome([FromQuery] TQueryParams queryParams, CancellationToken cancellationToken = default)
        {
            try
            {
                PaginatedResponse<TDto> items = await service.Get(queryParams, cancellationToken);
                return Ok(items);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting items with params: {@Params}", queryParams);
                return StatusCode(500, "An error occurred while retrieving items");
            }
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<TDto>> Get(K id, CancellationToken cancellationToken = default)
        {
            try
            {
                TDto? item = await service.GetById(id, cancellationToken);
                return item != null ? Ok(item) : NotFound();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting item with ID: {Id}", id);
                return StatusCode(500, "An error occurred while retrieving the item");
            }
        }

        [HttpPost]
        public async Task<ActionResult<TDto>> Create([FromBody] TRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                TDto item = await service.Add(request, cancellationToken);
                return CreatedAtAction(nameof(Create), new { id = item.Id }, item);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error creating item with request: {@Request}", request);
                return StatusCode(500, "An error occurred while creating the item");
            }
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<TDto>> Update(K id, [FromBody] TRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                TDto? item = await service.Update(id, request, cancellationToken);
                return item != null ? Ok(item) : NotFound();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating item {Id} with request: {@Request}", id, request);
                return StatusCode(500, "An error occurred while updating the item");
            }
        }

        [HttpDelete("{id:guid}")]
        public async Task<ActionResult> Delete(K id, CancellationToken cancellationToken = default)
        {
            try
            {
                bool result = await service.Remove(id, cancellationToken);
                return result ? NoContent() : NotFound();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error deleting item {Id}", id);
                return StatusCode(500, "An error occurred while deleting the item");
            }
        }
    }
}
