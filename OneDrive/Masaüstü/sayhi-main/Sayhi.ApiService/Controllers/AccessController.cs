using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sayhi.ApiService.Extensions;
using Sayhi.ApiService.Models;
using Sayhi.ApiService.Repositories;
using Sayhi.Model;

namespace Sayhi.ApiService.Controllers
{
    [AllowAnonymous]
    [ApiController]
    [Route("api/[controller]")]
    public class AccessController(IPersonRepository personRepository, IConfiguration configuration) : ControllerBase
    {
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req, CancellationToken cancellationToken = default)
        {
            Person? user = await personRepository
                .Find(p => (p.Name == req.Username || p.Email == req.Username) &&
                            p.Password == Utils.Hash(req.Password), cancellationToken);

            if (user == null)
                return Unauthorized();

            return Ok(new
            {
                token = JwtExtensions.GetToken(configuration, req.Username, user.Id),
                user = new
                {
                    id = user.Id,
                    name = user.Name,
                    email = user.Email,
                    avatar = user.AvatarUrl
                }
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req, CancellationToken cancellationToken = default)
        {
            // Check if user already exists
            Person? existingUser = await personRepository
                .Find(p => p.Email == req.Email || p.Name == req.Username, cancellationToken);

            if (existingUser != null)
                return BadRequest("Kullanıcı zaten mevcut");

            // Create new user
            Person newUser = new Person
            {
                Id = Guid.NewGuid(),
                Name = req.Username,
                Email = req.Email,
                Password = Utils.Hash(req.Password),
                CreatedAt = DateTimeOffset.UtcNow
            };

            await personRepository.Add(newUser, cancellationToken);

            return Ok(new
            {
                token = JwtExtensions.GetToken(configuration, req.Username, newUser.Id),
                user = new
                {
                    id = newUser.Id,
                    name = newUser.Name,
                    email = newUser.Email,
                    avatar = newUser.AvatarUrl
                }
            });
        }
    }
}
