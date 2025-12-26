using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sayhi.ApiService.Extensions;
using Sayhi.ApiService.Models.DTOs;
using Sayhi.ApiService.Models.Queries;
using Sayhi.ApiService.Models.Requests;
using Sayhi.ApiService.Services;

namespace Sayhi.ApiService.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController(
        IChatService chatService,
        IChatMessageService chatMessageService
        //IPersonService personService,
        //ILogger<ChatController> logger
        )
        : ControllerBase
        //: BaseController<Guid, ChatDto, ChatQueryParams>(chatService, logger)
    {
        [HttpGet]
        public async Task<IActionResult> GetChats(CancellationToken cancellationToken = default)
        {
            Guid userId = JwtExtensions.GetUserId(User);

            IEnumerable<ChatDto> chats = await chatService.GetByUser(userId, cancellationToken);

            ///logger.LogInformation("User Name {Name}, Id {UserId}.", User.Identity?.Name, userId);

            //Person? user = await personService.Find(p => p.Name == username || p.Email == username);

            return Ok(chats);

        }

        [HttpGet("{chatId}/messages")]
        public async Task<IActionResult> GetMessages([FromRoute] Guid chatId, CancellationToken cancellationToken = default)
        {
            Guid userId = JwtExtensions.GetUserId(User);

            IEnumerable<ChatMessageDto> messages = await chatMessageService.GetByChatId(chatId, userId, cancellationToken);

            return Ok(messages);
        }
    }
}
