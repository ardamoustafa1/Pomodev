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
    public class PeopleController(IPersonService service, ILogger<PeopleController> logger)
        : BaseController<Guid, Person, PersonDto, PersonQueryParams, PersonRequest>(service, logger)
    {
    }
}
