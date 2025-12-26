using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sayhi.ApiService.Models.DTOs;
using Sayhi.ApiService.Models.Queries;
using Sayhi.ApiService.Models.Requests;
using Sayhi.ApiService.Services;
using Sayhi.Model;

namespace Sayhi.ApiService.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class GroupsController(IGroupService service, ILogger<GroupsController> logger)
        : BaseController<Guid, Group, GroupDto, GroupQueryParams, GroupRequest>(service, logger)
    {
        /*
        [HttpGet]
        public async Task<ActionResult<List<GroupDto>>> GetGroups([FromQuery] GroupQueryParams queryParams)
        {
            try
            {
                var groups = await service.GetGroupsAsync(queryParams);
                return Ok(groups);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting groups with params: {@Params}", queryParams);
                return StatusCode(500, "An error occurred while retrieving groups");
            }
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<GroupDetailDto>> GetGroup(Guid id)
        {
            try
            {
                var group = await service.GetGroupByIdAsync(id);
                return group != null ? Ok(group) : NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting group with ID: {GroupId}", id);
                return StatusCode(500, "An error occurred while retrieving the group");
            }
        }

        [HttpPost]
        public async Task<ActionResult<GroupDto>> CreateGroup([FromBody] CreateGroupRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var group = await service.CreateGroupAsync(request);
                return CreatedAtAction(nameof(GetGroup), new { id = group.Id }, group);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating group with request: {@Request}", request);
                return StatusCode(500, "An error occurred while creating the group");
            }
        }

        [HttpGet("{id:guid}/agents")]
        public async Task<ActionResult<List<AgentDto>>> GetGroupAgents(Guid id)
        {
            try
            {
                var agents = await service.GetGroupAgentsAsync(id);
                return Ok(agents);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting agents for group {GroupId}", id);
                return StatusCode(500, "An error occurred while retrieving group agents");
            }
        }

        [HttpGet("{id:guid}/queues")]
        public async Task<ActionResult<List<QueueDto>>> GetGroupQueues(Guid id)
        {
            try
            {
                var queues = await service.GetGroupQueuesAsync(id);
                return Ok(queues);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting queues for group {GroupId}", id);
                return StatusCode(500, "An error occurred while retrieving group queues");
            }
        }
        */
    }
}
