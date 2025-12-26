using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.AI;
using Sayhi.AIGateway.Services;

namespace Sayhi.AIGateway.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatController(
    IChatService service
    ) : ControllerBase
{
    [HttpGet("{chatId}/ask/{input}")]
    public async Task<IActionResult> Ask([FromRoute] Guid chatId, [FromRoute] string input)
    {
        ChatMessage responseMessage = await service.Ask(chatId, input);
        return Ok(responseMessage.Text);
    }

    //[HttpGet("suggestions")]
    [HttpGet("{chatId}/suggestions")]
    //[HttpGet("{chatId}/messages/{messageId}/suggestions")]
    public async Task<IActionResult> GetSuggestions([FromRoute] Guid chatId)
    {
        string[] suggestions = await service.GetSuggestions(chatId);
        return Ok(suggestions);
    }

    [HttpGet]
    public async Task<IActionResult> GetChats()
    {
        Dictionary<Guid, List<(ChatRole, string)>> chats = service.GetChats();
        return Ok(chats);
    }

    [HttpGet("messages")]
    public async Task<IActionResult> GetMessages()
    {
        List<ChatMessage> messages = service.GetMessages();
        return Ok(messages);
    }
}
