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
    public class QueuesController(IQueueService service, ILogger<QueuesController> logger)
        : BaseController<Guid, Queue, QueueDto, QueueQueryParams, QueueRequest>(service, logger)
    {
        /*
        [HttpGet("{id:guid}/agents")]
        public async Task<ActionResult<List<AgentDto>>> GetQueueAgents(Guid id)
        {
            try
            {
                var agents = await _queueService.GetQueueAgentsAsync(id);
                return Ok(agents);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting agents for queue {QueueId}", id);
                return StatusCode(500, "An error occurred while retrieving queue agents");
            }
        }

        [HttpPost("{id:guid}/agents/{agentId:guid}")]
        public async Task<ActionResult> AssignAgentToQueue(Guid id, Guid agentId, [FromBody] AssignAgentToQueueRequest request)
        {
            try
            {
                var result = await _queueService.AssignAgentToQueueAsync(id, agentId, request.Priority);
                return result ? NoContent() : NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning agent {AgentId} to queue {QueueId}", agentId, id);
                return StatusCode(500, "An error occurred while assigning agent to queue");
            }
        }

        [HttpDelete("{id:guid}/agents/{agentId:guid}")]
        public async Task<ActionResult> RemoveAgentFromQueue(Guid id, Guid agentId)
        {
            try
            {
                var result = await _queueService.RemoveAgentFromQueueAsync(id, agentId);
                return result ? NoContent() : NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing agent {AgentId} from queue {QueueId}", agentId, id);
                return StatusCode(500, "An error occurred while removing agent from queue");
            }
        }

        [HttpGet("{id:guid}/stats")]
        public async Task<ActionResult<QueueStatsDto>> GetQueueStats(Guid id)
        {
            try
            {
                var stats = await _queueService.GetQueueStatsAsync(id);
                return stats != null ? Ok(stats) : NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting stats for queue {QueueId}", id);
                return StatusCode(500, "An error occurred while retrieving queue stats");
            }
        }
        */
    }
}