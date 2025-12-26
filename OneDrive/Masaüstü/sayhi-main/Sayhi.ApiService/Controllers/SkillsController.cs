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
    public class SkillsController(ISkillService service, ILogger<SkillsController> logger)
        : BaseController<Guid, Skill, SkillDto, SkillQueryParams, SkillRequest>(service, logger)
    {
        /*
        [HttpGet]
        public async Task<ActionResult<List<SkillDto>>> GetSkills([FromQuery] SkillQueryParams queryParams)
        {
            try
            {
                var skills = await _skillService.GetSkillsAsync(queryParams);
                return Ok(skills);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting skills with params: {@Params}", queryParams);
                return StatusCode(500, "An error occurred while retrieving skills");
            }
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<SkillDetailDto>> GetSkill(Guid id)
        {
            try
            {
                var skill = await _skillService.GetSkillByIdAsync(id);
                return skill != null ? Ok(skill) : NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting skill with ID: {SkillId}", id);
                return StatusCode(500, "An error occurred while retrieving the skill");
            }
        }

        [HttpPost]
        public async Task<ActionResult<SkillDto>> CreateSkill([FromBody] CreateSkillRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var skill = await _skillService.CreateSkillAsync(request);
                return CreatedAtAction(nameof(GetSkill), new { id = skill.Id }, skill);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating skill with request: {@Request}", request);
                return StatusCode(500, "An error occurred while creating the skill");
            }
        }

        [HttpGet("categories")]
        public ActionResult<List<string>> GetSkillCategories()
        {
            var categories = Enum.GetNames(typeof(SkillCategory));
            return Ok(categories);
        }
        */
    }
}
