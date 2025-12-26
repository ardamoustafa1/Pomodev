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
    public class AgentsController(IAgentService service, ILogger<AgentsController> logger)
        //: ControllerBase
        : BaseController<Guid, Agent, AgentDto, AgentQueryParams, AgentRequest>(service, logger)
    {
        [HttpPatch("{id:guid}/status")]
        public async Task<ActionResult> UpdateAgentStatus(Guid id, [FromBody] SetAgentStatusRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                bool result = await service.SetAgentStatus(id, request.Status, cancellationToken);
                return result
                    ? NoContent()
                    : NotFound();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating status for agent {AgentId}", id);
                return StatusCode(500, "An error occurred while updating agent status");
            }
        }

        /*
        [HttpGet("{id:guid}/skills")]
        public async Task<ActionResult<List<AgentSkillDto>>> GetAgentSkills(Guid id, CancellationToken cancellationToken = default)
        {
            try
            {
                var skills = await service.GetAgentSkills(id);
                return Ok(skills);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting skills for agent {AgentId}", id);
                return StatusCode(500, "An error occurred while retrieving agent skills");
            }
        }

        [HttpPost("{id:guid}/skills")]
        public async Task<ActionResult> AddAgentSkill(Guid id, [FromBody] AddAgentSkillRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await service.AddAgentSkill(id, request);
                return result ? NoContent() : NotFound();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error adding skill to agent {AgentId}", id);
                return StatusCode(500, "An error occurred while adding skill to agent");
            }
        }
        */
    }
}
